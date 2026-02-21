import { ABYSS_API_KEY } from 'core/variables';
import {
  ApplicationCommandOptionTypes,
  DiscordApplicationIntegrationType,
  DiscordInteractionContextType,
  MessageComponentTypes,
  MessageFlags,
  type MessageComponents,
} from 'discordeno';
import createApplicationCommand from 'helpers/command';
import { ApplicationCommandCategory, RequestMethod, ResponseType } from 'types/types';
import { makeRequest } from 'utils/request';

createApplicationCommand({
  name: 'item',
  description: 'Views information about the selected item.',
  details: {
    category: ApplicationCommandCategory.Abyss,
    cooldown: 5,
  },
  integrationTypes: [DiscordApplicationIntegrationType.GuildInstall, DiscordApplicationIntegrationType.UserInstall],
  contexts: [
    DiscordInteractionContextType.BotDm,
    DiscordInteractionContextType.Guild,
    DiscordInteractionContextType.PrivateChannel,
  ],
  options: [
    {
      name: 'item',
      description: 'Pick an item to view information about.',
      type: ApplicationCommandOptionTypes.String,
      required: true,
      autocomplete: true,
    },
  ],
  acknowledge: true,
  async autocomplete(bot, interaction, options) {
    const focused =
      interaction.data?.options
        ?.find((opt) => opt.focused)
        ?.value?.toString()
        .toLowerCase() ?? '';

    const items = await makeRequest('http://localhost:9999/items', {
      method: RequestMethod.GET,
      response: ResponseType.JSON,
      headers: {
        'x-api-key': ABYSS_API_KEY,
      },
    });

    const choices = items
      .filter((item: any) => {
        if (!focused) return true;

        return item.name.toLowerCase().includes(focused);
      })
      .slice(0, 25)
      .map((item: any) => ({
        name: item.name,
        value: item.name,
      }));

    return interaction.respond({ choices });
  },
  async run(bot, interaction, options) {
    const item = await makeRequest(`http://localhost:9999/items`, {
      method: RequestMethod.GET,
      response: ResponseType.JSON,
      params: {
        name: options.item,
      },
      headers: {
        'x-api-key': ABYSS_API_KEY,
      },
    });

    await interaction.edit({
      components: [
        {
          type: MessageComponentTypes.Container,
          components: [
            {
              type: MessageComponentTypes.Section,
              components: [
                {
                  type: MessageComponentTypes.TextDisplay,
                  content: `# ${item.name}\n-# ${item.rarity}${item.note ? ` *- ${item.note}*` : ''}${item.description ? `\n*${item.description}*` : ''}`,
                },
              ],
              accessory: {
                type: MessageComponentTypes.Thumbnail,
                media: {
                  url: item.image,
                },
              },
            },
            ...(item.obtained_from
              ? ([
                  {
                    type: MessageComponentTypes.ActionRow,
                    components: [
                      {
                        type: MessageComponentTypes.StringSelect,
                        customId: 'item-obtained-from',
                        placeholder: 'Obtained From:',
                        options: [
                          {
                            label: item.obtained_from,
                            value: item.obtained_from,
                          },
                        ],
                      },
                    ],
                  },
                ] satisfies MessageComponents)
              : []),
          ],
        },
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
});
