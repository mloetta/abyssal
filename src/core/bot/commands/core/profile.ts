import {
  ApplicationCommandOptionTypes,
  avatarUrl,
  DiscordApplicationIntegrationType,
  DiscordInteractionContextType,
  iconBigintToHash,
  MessageComponentTypes,
  MessageFlags,
  snowflakeToTimestamp,
  type MessageComponents,
} from 'discordeno';
import createApplicationCommand from 'helpers/command';
import { ApplicationCommandCategory, TimestampStyle } from 'types/types';
import { commandMention, icon, pill, timestamp } from 'utils/markdown';
import { redis } from 'utils/redis';

createApplicationCommand({
  name: 'profile',
  description: "Views a user's profile.",
  details: {
    category: ApplicationCommandCategory.Core,
    cooldown: 3,
  },
  integrationTypes: [DiscordApplicationIntegrationType.GuildInstall, DiscordApplicationIntegrationType.UserInstall],
  contexts: [
    DiscordInteractionContextType.BotDm,
    DiscordInteractionContextType.Guild,
    DiscordInteractionContextType.PrivateChannel,
  ],
  options: [
    {
      name: 'user',
      description: 'The user to view the profile of.',
      type: ApplicationCommandOptionTypes.User,
      required: false,
    },
  ],
  acknowledge: true,
  async run(bot, interaction, options) {
    const user = await bot.helpers.getUser(options.user?.user.id ?? interaction.user.id);

    if (!user) {
      await interaction.edit({
        components: [
          {
            type: MessageComponentTypes.Container,
            components: [
              {
                type: MessageComponentTypes.TextDisplay,
                content: "Couldn't find the given user.",
              },
            ],
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      });

      return;
    }

    // User info that we gna display
    const avatar = avatarUrl(user.id, iconBigintToHash(user.avatar!));
    const createdAt = snowflakeToTimestamp(user.id);

    // Command usage data
    const usage = await redis.hGetAll(`abyss:usage:${user.id}`);
    const totalUsage = (await redis.get(`abyss:usage:${user.id}:total`)) ?? '0';
    const topCommands = Object.entries(usage)
      .map(([key, count]) => {
        const [name, id] = key.split(':');
        return { name, id, count };
      })
      .sort((a, b) => Number(b.count) - Number(a.count))
      .slice(0, 3);

    const topEntry = topCommands.length ? topCommands[0] : null;
    const topCommand = topEntry?.name ?? null;
    const topCount = topEntry?.count ?? '0';
    const topId = topEntry?.id ?? '';

    const topCommandMessages: Record<string, (count: string, id: string) => string> = {
      artifact: (count, id) =>
        `You've used ${commandMention('artifact', id)} **${count}** times. Even the Abyss cannot hide its secrets forever.`,
      fih: (count, id) =>
        `You've used ${commandMention('fih', id)} **${count}** times — Creatures of the deep no longer flee from you.`,
      item: (count, id) =>
        `You've used ${commandMention('item', id)} **${count}** times. This item hums with dormant power.`,
      mutation: (count, id) =>
        `You've used ${commandMention('mutation', id)} **${count}** times. Limits are temporary. Evolution is permanent.`,
      race: (count, id) =>
        `You've used ${commandMention('race', id)} **${count}** times. Your blood remembers what others forgot.`,
      tool: (count, id) =>
        `You've used ${commandMention('tool', id)} **${count}** times. The deeper the grind, the stronger the yield.`,
    };

    const topMessage = topCommand ? (topCommandMessages[topCommand]?.(topCount, topId) ?? '') : '';

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
                  content: `${icon('Mention')} **${user.username}** ${pill(user.id)}\n${timestamp(createdAt, TimestampStyle.LongDate)}`,
                },
              ],
              accessory: {
                type: MessageComponentTypes.Thumbnail,
                media: {
                  url: avatar,
                },
              },
            },
            ...(topCommands.length
              ? ([
                  {
                    type: MessageComponentTypes.Separator,
                  },
                  {
                    type: MessageComponentTypes.TextDisplay,
                    content: `${topMessage ? `-# ${topMessage}` : ''}${topCommands.length ? `\n${topCommands.map((cmd, i) => `${i + 1}. ${commandMention(cmd.name!, cmd.id!)} — **${cmd.count}** uses`).join('\n')}` : ''}\n\nYou've used **${totalUsage}** commands in total.\nYour perseverance in exploring the abyss is commendable.`,
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
