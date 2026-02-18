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
  name: 'race',
  description: 'Views information about the selected race.',
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
      name: 'race',
      description: 'Pick a race to view information about.',
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

    const races = await makeRequest('http://localhost:9999/races', {
      method: RequestMethod.GET,
      response: ResponseType.JSON,
      headers: {
        'x-api-key': ABYSS_API_KEY,
      },
    });

    const choices = races
      .filter((race: any) => {
        if (!focused) return true;

        return race.name.toLowerCase().includes(focused);
      })
      .slice(0, 25)
      .map((race: any) => ({
        name: race.name,
        value: race.name,
      }));

    return interaction.respond({ choices });
  },
  async run(bot, interaction, options) {
    const race = await makeRequest(`http://localhost:9999/races`, {
      method: RequestMethod.GET,
      response: ResponseType.JSON,
      params: {
        name: options.race,
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
                  content: `# ${race.name}\n-# ${race.rarity}${race.note ? `\n-# *${race.note}*` : ''}`,
                },
              ],
              accessory: {
                type: MessageComponentTypes.Thumbnail,
                media: {
                  url: race.image,
                },
              },
            },
            {
              type: MessageComponentTypes.Separator,
            },
            {
              type: MessageComponentTypes.TextDisplay,
              content: `## Information:\n- Reroll Chance: **${race.reroll_chance}**\n- Lucky Reroll Chance: **${race.lucky_reroll_chance}**`,
            },
            {
              type: MessageComponentTypes.Separator,
            },
            {
              type: MessageComponentTypes.TextDisplay,
              content: `## Passive:\n> ${race.passive.replace(/\n/g, '\n> ')}`,
            },
          ],
        },
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
});
