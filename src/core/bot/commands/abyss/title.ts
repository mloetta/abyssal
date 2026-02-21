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
  name: 'title',
  description: 'Views information about the selected title.',
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
      name: 'title',
      description: 'Pick a title to view information about.',
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

    const titles = await makeRequest('http://localhost:9999/titles', {
      method: RequestMethod.GET,
      response: ResponseType.JSON,
      headers: {
        'x-api-key': ABYSS_API_KEY,
      },
    });

    const choices = titles
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
    const title = await makeRequest(`http://localhost:9999/titles`, {
      method: RequestMethod.GET,
      response: ResponseType.JSON,
      params: {
        name: options.title,
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
              type: MessageComponentTypes.TextDisplay,
              content: `## ${title.name}\n*${title.requirement}*`,
            },
          ],
        },
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
});
