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
  name: 'npc',
  description: 'Views information about the selected npc.',
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
      name: 'npc',
      description: 'Pick an npc to view information about.',
      type: ApplicationCommandOptionTypes.String,
      required: true,
      autocomplete: true,
    },
  ],
  dev: true,
  acknowledge: true,
  async autocomplete(bot, interaction, options) {
    const focused =
      interaction.data?.options
        ?.find((opt) => opt.focused)
        ?.value?.toString()
        .toLowerCase() ?? '';

    const npcs = await makeRequest('http://localhost:9999/npcs', {
      method: RequestMethod.GET,
      response: ResponseType.JSON,
      headers: {
        'x-api-key': ABYSS_API_KEY,
      },
    });

    const choices = npcs
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
    const npc = await makeRequest(`http://localhost:9999/npcs`, {
      method: RequestMethod.GET,
      response: ResponseType.JSON,
      params: {
        name: options.npc,
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
                  content: `# ${npc.name}\n-# ${npc.role}\n*${npc.description}*`,
                },
              ],
              accessory: {
                type: MessageComponentTypes.Thumbnail,
                media: {
                  url: npc.image,
                },
              },
            },
            ...(npc.quest
              ? ([
                  {
                    type: MessageComponentTypes.Separator,
                  },
                  {
                    type: MessageComponentTypes.TextDisplay,
                    content: `## Quests:\n${npc.quest.map((q: any) => `**${q.name}**\n> ${q.quest}\n> *${q.reward}*`).join('\n\n')}`,
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
