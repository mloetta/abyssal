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
  name: 'tool',
  description: 'Views information about the selected tool.',
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
      name: 'tool',
      description: 'Pick a tool to view information about.',
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

    const tools = await makeRequest('http://localhost:9999/tools', {
      method: RequestMethod.GET,
      response: ResponseType.JSON,
      headers: {
        'x-api-key': ABYSS_API_KEY,
      },
    });

    const choices = tools
      .filter((tool: any) => {
        if (!focused) return true;

        return tool.name.toLowerCase().includes(focused);
      })
      .slice(0, 25)
      .map((tool: any) => ({
        name: tool.name,
        value: tool.name,
      }));

    return interaction.respond({ choices });
  },
  async run(bot, interaction, options) {
    const tool = await makeRequest(`http://localhost:9999/tools`, {
      method: RequestMethod.GET,
      response: ResponseType.JSON,
      params: {
        name: options.tool,
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
                  content: `# ${tool.name}\n-# *${tool.obtained_from}*`,
                },
              ],
              accessory: {
                type: MessageComponentTypes.Thumbnail,
                media: {
                  url: tool.image,
                },
              },
            },
            {
              type: MessageComponentTypes.Separator,
            },
            {
              type: MessageComponentTypes.TextDisplay,
              content: `- Cost: **${tool.cost}**${tool.damage ? `\n- Damage: **${tool.damage}**` : ''}${tool.cooldown ? `\n- Cooldown: **${tool.cooldown}s**` : ''}${tool.control ? `\n- Control: **${tool.control}**` : ''}${tool.oxygen ? `\n- Oxygen: **${tool.oxygen}**` : ''}${tool.max_depth ? `\n- Max Depth: **${tool.max_depth}m**` : ''}${tool.speed ? `\n- Speed: **${tool.speed}**` : ''}${tool.weight ? `\n- Weight: **${tool.weight}**` : ''}${tool.usage ? `\n- Usage: **${tool.usage}**` : ''}`,
            },
          ],
        },
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
});
