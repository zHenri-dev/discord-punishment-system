const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
const moment = require("moment"); moment.locale("pt-br");

module.exports = class Punir {
    constructor(client) {
        this.client = client;
        this.name = "punir";
        this.aliases = [];
    }

    async run({ message, args }) {
        if (!message.guild) return;
        let member = message.mentions.members.first() || await message.guild.members.cache.get(args[0])
        if (!member) {
            message.reply({ content: "Você precisa mencionar o membro que deseja punir juntamente ao uso do comando! A seguir você poderá escolher um motivo entre os listados." }).then(msg => { setTimeout(() => { msg.delete().catch(() => { }); message.delete().catch(() => { }); }, 15000); })
            return;
        }
        let punishingEmbed = new MessageEmbed()
            .setAuthor({ name: `${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setDescription(`\`\`\`Aplicando punição em: ${member.user.tag}\nO membro está no servidor desde ${moment(member.joinedAt).format('LLLL')}.\`\`\``)
            .setFooter({ text: "Este comando tem um tempo de duração de 60 segundos para que você escolha o motivo." })

        let options = [];
        for (let reason in this.client.reasons) {
            let optionsObject = this.client.reasons[reason];
            let duration;
            if (!optionsObject.time || optionsObject.time <= 0) duration = "Permanente";
            else duration = await this.client.functions.getFormatedTime(optionsObject.time);
            options.push({
                label: `${optionsObject.name}`,
                emoji: optionsObject.emoji,
                description: `Duração: ${duration}`,
                value: reason,
            });
        }

        const row = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId(`punishment-select`)
                .setPlaceholder('Selecione o motivo da punição...')
                .addOptions(options)
        );

        let punishingMessage = await message.channel.send({ embeds: [punishingEmbed], components: [row] });
        const filter = (interaction) => interaction.user.id == message.author.id;
        const collector = punishingMessage.createMessageComponentCollector({ filter, time: 60000 });
        collector.on("collect", async i => {
            i.deferUpdate();
            let reasonName = i.values[0];
            let reason = this.client.reasons[reasonName];
            if (!reason) return collector.stop();
            let proofEmbed = new MessageEmbed()
                .setDescription(`\`👮‍♂️\` É necessário que **${message.author.username}** (Você!) envie aqui provas que serão anexadas juntamente a punição ao membro!`);
            let proofMessage = await message.channel.send({ embeds: [proofEmbed] }).catch(() => { });
            const proofFilter = m => m.author.id == message.author.id;
            const proofCollector = proofMessage.channel.createMessageCollector({ proofFilter, time: 60000 });
            proofCollector.on("collect", async (collectMessage) => {
                if (!collectMessage.content || collectMessage.author.bot) return proofCollector.stop();
                let logChannel = await this.client.channels.cache.get(this.client.config.logChannelId);
                if (!logChannel) return proofCollector.stop();
                let status = "O membro ainda está punido";
                let proof = `\n⠀Provas: ${collectMessage.content}`;
                if (!reason.time || reason.time <= 0) {
                    status = "A punição aplicada ao membro é permanente";
                    proof = "";
                }
                if (reason.type == "ban") member.ban({ reason: `Autor: ${message.author.tag} (ID: ${message.author.id}) | Motivo enviado pelo autor: ${collectMessage.content} | Data de aplicação em ${moment().format("LLL")}` }).catch(() => { });
                else member.roles.add(this.client.config.punishmentRoleId).catch(() => { });
                let logEmbed = new MessageEmbed()
                    .setAuthor({ name: "Registro de punição!", iconURL: "https://i.imgur.com/mxcuRFR.png" })
                    .setDescription(`Estado atual da punição: \`${status}\`;\n\nUm membro foi punido do servidor de discord recentemente, confira abaixo\nalgumas informações sobre a punição, dentre elas quem aplicou, motivo e membro\npunido.\n\n\`\`\`⠀⠀ID: ${member.id}\n\n⠀Membro: ${member.user.tag}\n⠀Motivo da punição:  ${reason.name}\n⠀Punição aplicada por: ${message.author.tag}${proof}\`\`\``)
                    .setFooter({ text: `A punição foi aplicada em ${moment().format("LLL")}` })
                let logMessage = await logChannel.send({ embeds: [logEmbed] }).catch(() => { });
                this.client.database.punishments.create({
                    userId: member.id,
                    authorId: message.author.id,
                    guildId: message.guild.id,
                    logGuildId: logMessage.guild.id,
                    logChannelId: logMessage.channel.id,
                    logMessageId: logMessage.id,
                    reason: reasonName,
                    type: reason.type,
                    time: reason.time,
                    proof: collectMessage.content,
                    createdAt: new Date().getTime(),
                    performed: false
                });
                let successEmbed = new MessageEmbed()
                    .setAuthor({ name: `${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                    .setDescription(`O membro \`${member.user.username}\` foi punido pelo motivo \`${reason.name}\`.\n[Clique aqui para mais informações sobre a punição.](https://discord.com/channels/${message.guild.id}/${this.client.config.logChannelId}/${logMessage.id})`)
                    .setFooter({ text: "Qualquer administrador ou superior pode remover quaisquer punições pelo comando despunir." })
                    .setTimestamp();
                message.channel.send({ embeds: [successEmbed] }).catch(() => { });
                proofCollector.stop();
            });
            proofCollector.on("end", () => {
                collector.stop();
                proofMessage.react("👍").catch(() => { });
            });
        });
        collector.on("end", () => {
            punishingMessage.delete().catch(() => { });
            message.delete().catch(() => { });
        });
    }
};