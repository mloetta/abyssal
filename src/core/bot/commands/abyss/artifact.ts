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
  name: 'artifact',
  description: 'Views information about the selected artifact.',
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
      name: 'artifact',
      description: 'Pick an artifact to view information about.',
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

    const artifacts = await makeRequest('http://localhost:9999/artifacts', {
      method: RequestMethod.GET,
      response: ResponseType.JSON,
      headers: {
        'x-api-key': ABYSS_API_KEY,
      },
    });

    const choices = artifacts
      .filter((artifact: any) => {
        if (!focused) return true;

        return artifact.name.toLowerCase().includes(focused);
      })
      .slice(0, 25)
      .map((artifact: any) => ({
        name: artifact.name,
        value: artifact.name,
      }));

    return interaction.respond({ choices });
  },
  async run(bot, interaction, options) {
    const artifact = await makeRequest(`http://localhost:9999/artifacts`, {
      method: RequestMethod.GET,
      response: ResponseType.JSON,
      params: {
        name: options.artifact,
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
                  content: `# ${artifact.name}\n-# ${artifact.rarity.rarity}${artifact.rarity.chance ? ` (${artifact.rarity.chance})` : ''}`,
                },
              ],
              accessory: {
                type: MessageComponentTypes.Thumbnail,
                media: {
                  url: artifact.image,
                },
              },
            },
            {
                type: MessageComponentTypes.ActionRow,
                components: [
                    {
                        type: MessageComponentTypes.StringSelect,
                        customId: 'artifact-obtained-from',
                        placeholder: 'Obtained From:',
                        options: [{
                            label: artifact.obtained_from,
                            value: artifact.obtained_from,
                        }]
                    }
                ]
            },
            {
              type: MessageComponentTypes.Separator,
            },
            {
              type: MessageComponentTypes.TextDisplay,
              content: `## Information:${artifact.speed ? `\n- Speed: **${typeof artifact.speed === 'object' ? `${artifact.speed.min} - ${artifact.speed.max}` : artifact.speed}**` : ''}${artifact.damage ? `\n- Damage: **${typeof artifact.damage === 'object' ? `${artifact.damage.min} - ${artifact.damage.max}` : artifact.damage}**` : ''}${artifact.oxygen ? `\n- Oxygen: **${typeof artifact.oxygen === 'object' ? `${artifact.oxygen.min} - ${artifact.oxygen.max}` : artifact.oxygen}**` : ''}${artifact.cooldown ? `\n- Cooldown: **${typeof artifact.cooldown === 'object' ? `${artifact.cooldown.min} - ${artifact.cooldown.max}` : artifact.cooldown}**` : ''}${artifact.weight ? `\n- Weight: **${typeof artifact.weight === 'object' ? `${artifact.weight.min} - ${artifact.weight.max}` : artifact.weight}**` : ''}${artifact.XP ? `\n- XP: **${typeof artifact.XP === 'object' ? `${artifact.XP.min} - ${artifact.XP.max}` : artifact.XP}**` : ''}${artifact.cash ? `\n- Cash: **${typeof artifact.cash === 'object' ? `${artifact.cash.min} - ${artifact.cash.max}` : artifact.cash}**` : ''}`,
            },
          ],
        },
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
});
