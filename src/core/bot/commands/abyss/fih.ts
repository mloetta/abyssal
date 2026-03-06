import { ABYSS_API_KEY } from 'core/variables';
import {
  ApplicationCommandOptionTypes,
  DiscordApplicationIntegrationType,
  DiscordInteractionContextType,
  MessageComponentTypes,
  MessageFlags,
} from 'discordeno';
import createApplicationCommand from 'helpers/command';
import { ApplicationCommandCategory, RequestMethod, ResponseType } from 'types/types';
import { makeRequest } from 'utils/request';

createApplicationCommand({
  name: 'fih',
  description: 'Views information about the selected fish.',
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
      name: 'fish',
      description: 'Pick a fish to view information about.',
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

    const fishes = await makeRequest('http://localhost:9999/fishes', {
      method: RequestMethod.GET,
      response: ResponseType.JSON,
      headers: {
        'x-api-key': ABYSS_API_KEY,
      },
    });

    const choices = fishes
      .filter((fish: any) => {
        if (!focused) return true;

        return fish.name.toLowerCase().includes(focused);
      })
      .slice(0, 25)
      .map((fish: any) => ({
        name: fish.name,
        value: fish.name,
      }));

    return interaction.respond({ choices });
  },
  async run(bot, interaction, options) {
    const fish = await makeRequest(`http://localhost:9999/fishes`, {
      method: RequestMethod.GET,
      response: ResponseType.JSON,
      params: {
        name: options.fish,
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
                  content: `# ${fish.name}\n-# ${fish.rarity}${fish.note ? ` *- ${fish.note}*` : ''}${fish.description ? `\n*${fish.description}*` : ''}`,
                },
              ],
              accessory: {
                type: MessageComponentTypes.Thumbnail,
                media: {
                  url: fish.image,
                },
              },
            },
            {
              type: MessageComponentTypes.ActionRow,
              components: [
                {
                  type: MessageComponentTypes.StringSelect,
                  customId: 'fish-location',
                  placeholder: 'Located:',
                  options: fish.located.map((loc: any) => ({
                    label: loc,
                    value: loc,
                  })),
                },
              ],
            },
            {
              type: MessageComponentTypes.Separator,
            },
            {
              type: MessageComponentTypes.TextDisplay,
              content: `- Minigame Threshold: **${fish.minigame_threshold}**\n- Health: **${fish.health}**\n- Weight: **${fish.weight.min} - ${fish.weight.max}**\n- Base Price: **${fish.base_price}**\n- Behavior: **${fish.behavior}**${fish.damage ? `\n- Damage: **${fish.damage}**` : ''}`,
            },
          ],
        },
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
});
