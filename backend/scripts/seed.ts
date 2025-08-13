// seed.ts
import mongoose, { Types } from 'mongoose';
import { faker } from '@faker-js/faker';
import User from '@src/models/User';
import Chat, { ChatType } from '@src/models/Chat';
import ChatMember, { ChatMemberRole } from '@src/models/ChatMembers';
import Message, { MessageType } from '@src/models/Message';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tudo-CHATAPP-dev';

const NUM_USERS = 12;
const NUM_GROUP_CHATS = 4;
const NUM_DM_CHATS = 6;
const MSGS_PER_CHAT_MIN = 5;
const MSGS_PER_CHAT_MAX = 12;

const truncate = (s: string, max: number) => (s.length > max ? s.slice(0, max) : s);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}),
    Chat.deleteMany({}),
    ChatMember.deleteMany({}),
    Message.deleteMany({}),
  ]);
  console.log('Cleared collections');

  // 1) Users (ensure unique usernames)
  const usedUsernames = new Set<string>();
  const usersDocs: InstanceType<typeof User>[] = [];
  while (usersDocs.length < NUM_USERS) {
    const base = faker.internet.username().slice(0,20).toLowerCase().replace(/\W+/g, '');
    let candidate = base.slice(0, 20) || faker.string.alphanumeric(6).toLowerCase();
    let suffix = 1;
    while (usedUsernames.has(candidate)) {
      candidate = `${base}${suffix}`.slice(0, 20);
      suffix += 1;
    }
    usedUsernames.add(candidate);

    usersDocs.push(
      new User({
        name: faker.person.fullName(),
        user_name: candidate,
        avatarUrl: faker.image.avatar(),
        password: '$2b$10$ITv.3RaImcBF2YBb3ZT4CO0K4REVQ2bWSk7xqFDswVrdVqk7SU0fG',
        bio: truncate(faker.lorem.sentence({ min: 6, max: 16 }), 100),
      })
    );
  }
  await User.insertMany(usersDocs);
  const users = await User.find({});
  console.log(`Inserted ${users.length} users`);

  // 2) Group chats
  const groupChats: InstanceType<typeof Chat>[] = [];
  for (let i = 0; i < NUM_GROUP_CHATS; i++) {
    groupChats.push(
      new Chat({
        chat_type: ChatType.Group,
        name: faker.company.name(),
        bio: truncate(faker.lorem.sentence({ min: 6, max: 14 }), 100),
        avatarUrl: faker.image.urlPicsumPhotos(),
        members: [],
      })
    );
  }
  await Chat.insertMany(groupChats);

  // 3) DM chats
  const dmChats: InstanceType<typeof Chat>[] = [];
  for (let i = 0; i < NUM_DM_CHATS; i++) {
    dmChats.push(
      new Chat({
        chat_type: ChatType.User,
        members: [],
      })
    );
  }
  await Chat.insertMany(dmChats);

  const allChats = await Chat.find({});
  console.log(`Inserted ${allChats.length} chats`);

  // 4) Chat members
  const chatMemberDocs: InstanceType<typeof ChatMember>[] = [];
  for (const chat of allChats) {
    const memberCount = chat.chat_type === ChatType.Group ? faker.number.int({ min: 3, max: 6 }) : 2;
    const shuffled = faker.helpers.shuffle(users).slice(0, memberCount);

    shuffled.forEach((u, idx) => {
      chatMemberDocs.push(
        new ChatMember({
          chat_id: chat._id,
          user_id: u._id,
          role: idx === 0 ? ChatMemberRole.Admin : ChatMemberRole.Member,
          last_seen: faker.date.recent({ days: 7 }),
        })
      );
    });

    chat.members = shuffled.map((u) => new Types.ObjectId(u._id));
    await chat.save(); // respects ChatType pre-save rules
  }
  await ChatMember.insertMany(chatMemberDocs);
  console.log(`Inserted ${chatMemberDocs.length} chat members`);

  // 5) Messages — use create() to trigger post('save') hook
  for (const chat of allChats) {
    const memberIds = chat.members;
    if (!memberIds || memberIds.length === 0) continue;

    const count = faker.number.int({ min: MSGS_PER_CHAT_MIN, max: MSGS_PER_CHAT_MAX });
    let lastText = '';
    let lastAuthor: mongoose.Types.ObjectId | null = null;

    for (let i = 0; i < count; i++) {
      const authorId = faker.helpers.arrayElement(memberIds) as mongoose.Types.ObjectId;
      const text = truncate(faker.lorem.sentence({ min: 6, max: 16 }), 500);

      const msg = await Message.create({
        author_id: authorId,
        chat_id: chat._id,
        type: MessageType.Text,
        text,
      });

      // Track for manual fallback update
      lastText = msg.text || '';
      lastAuthor = msg.author_id as any;
    }

    // Manual fallback to ensure Chat.last_msg & last_msg_author are set
    if (lastAuthor) {
      await Chat.findByIdAndUpdate(
        chat._id,
        { $set: { last_msg: lastText, last_msg_author: lastAuthor } },
        { new: true }
      );
    }
  }
  console.log('Inserted messages and ensured last_msg fields');

  await mongoose.disconnect();
  console.log('Seeding completed ✅');
}

seed().catch((err) => {
  console.error(err);
  mongoose.disconnect();
});
