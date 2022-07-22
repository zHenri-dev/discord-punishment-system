const { EmbedBuilder } = require("discord.js");
const moment = require("moment");
moment.locale("pt-br");

module.exports = class Hist {
    constructor(client) {
        this.client = client;
        this.name = "hist";
        this.aliases = [];
    }

    async run({ message, args }) {
        if (!message.guild) return;
        let member = message.mentions.members.first() || await message.guild.members.cache.get(args[0])
        if (!member) {
            message.reply({ content: "Você precisa mencionar o membro que deseja punir juntamente ao uso do comando! A seguir você poderá escolher um motivo entre os listados." }).then(msg => { setTimeout(() => { msg.delete().catch(() => { }); message.delete().catch(() => { }); }, 15000); })
            return;
        }
        let hist = "Nenhuma punição em vigor ou aplicada anteriormente.";
        let userPunishments = await this.client.database.punishments.find({ userId: member.id });
        userPunishments.sort((a, b) => { return new Date(b.createdAt) - new Date(a.createdAt) });

        let first = userPunishments[0];
        if (first) {
            let firstReasonName = this.client.reasons[first.reason].name;
            if (!firstReasonName) firstReasonName = first.reason;
            let firstAuthor = await this.client.users.cache.get(first.authorId);
            let firstAuthorTag = first.authorId;
            if (firstAuthor) firstAuthorTag = firstAuthor.tag
            hist = `\`[${moment(first.createdAt).format("DD/MM HH:mm[hrs]")}]\` [[i]](https://discord.com/channels/${first.guildId}/${first.logChannelId}/${first.logMessageId}) **${firstReasonName}** aplicada por **${firstAuthorTag}**.`
        }

        let second = userPunishments[1];
        if (second) {
            let secondReasonName = this.client.reasons[second.reason].name;
            if (!secondReasonName) secondReasonName = second.reason;
            let secondAuthor = await this.client.users.cache.get(second.authorId);
            let secondAuthorTag = second.authorId;
            if (secondAuthor) secondAuthorTag = secondAuthor.tag
            hist += `\n\`[${moment(second.createdAt).format("DD/MM HH:mm[hrs]")}]\` [[i]](https://discord.com/channels/${second.guildId}/${second.logChannelId}/${second.logMessageId}) **${secondReasonName}** aplicada por **${secondAuthorTag}**.`
        }


        if (userPunishments.length - 2 > 0) hist += `\n+${userPunishments.length - 2} outras punições aplicadas anteriormente.`

        let histEmbed = new EmbedBuilder()
            .setAuthor({ name: `${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setDescription(`A seguir está todo o histórico de punições do membro: \`${member.user.tag}\`\n\n<:noban:958562167077077012> **PUNIÇÕES:**\n${hist}\n⠀`)
            .setFooter({ text: "Todas as informações que são coletadas são salvas em um banco de dados privado, nenhuma dessas informações podem ser alteradas por terceiros.", iconURL: "https://i.imgur.com/A2pSNFN.png" })
        message.channel.send({ embeds: [histEmbed] });
    }
};