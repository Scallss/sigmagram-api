import { PrismaClient } from '@prisma/client';
import * as argon from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword1 = await argon.hash('password1');
  const hashedPassword2 = await argon.hash('password2');
  
  const user1 = await prisma.user.upsert({
    where: { username: 'user1' },
    update: {},
    create: {
      username: 'user1',
      password: hashedPassword1,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { username: 'user2' },
    update: {},
    create: {
      username: 'user2',
      password: hashedPassword2,
    },
  });

  // Create dummy communities
  const community1 = await prisma.community.upsert({
    where: { category: 'Technology' },
    update: {},
    create: {
      category: 'Technology',
      homePhoto: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNZc2qhPEexG-Pg9op2n9lsRVfyyJ2PBVdDQ&s',
      description: 'A community for tech enthusiasts',
      creatorId: user1.id,
    },
  });

  const community2 = await prisma.community.upsert({
    where: { category: 'Gaming' },
    update: {},
    create: {
      category: 'Gaming',
      homePhoto: 'https://blog-asset.jakmall.com/blog/content/images/2020/11/20f535c616bbe807a1166e5661b396fd.jpg',
      description: 'A community for gamers',
      creatorId: user2.id,
    },
  });

  // Create dummy posts
  const posts = [
    {
      content: 'Post about JavaScript',
      photo: 'https://www.datocms-assets.com/48401/1628644950-javascript.png',
      authorId: user1.id,
      communityId: community1.id,
    },
    {
      content: 'Post about Python',
      photo: 'https://ideacdn.net/idea/ct/82/myassets/blogs/python-avantaj.jpg?revision=1581874510',
      authorId: user1.id,
      communityId: community1.id,
    },
    {
      content: 'Post about Gaming Tips',
      photo: 'https://www.marvelrivals.com/m/gw/20241128112248/img/3_ba97929e.jpg',
      authorId: user2.id,
      communityId: community2.id,
    },
    {
      content: 'Post about AI',
      photo: 'https://static.designboom.com/wp-content/uploads/2025/03/openAI-chat-GPT-4o-generate-studio-ghibli-style-AI-images-designboom-03.jpg',
      authorId: user1.id,
      communityId: community1.id,
    },
    {
      content: 'Post about Cloud Computing',
      photo: 'https://miro.medium.com/v2/resize:fit:2000/1*vLNbKAWbGtFLC7tUBYb50A.png',
      authorId: user1.id,
      communityId: community1.id,
    },
    {
      content: 'Post about Game Development',
      photo: 'https://www.nuclino.com/img/solutions/game-design-software-godot.jpg',
      authorId: user2.id,
      communityId: community2.id,
    },
    {
      content: 'Post about React',
      photo: 'https://media.licdn.com/dms/image/v2/D5612AQFQan9n3HHl_A/article-cover_image-shrink_600_2000/article-cover_image-shrink_600_2000/0/1734182720197?e=2147483647&v=beta&t=QymTx0ihHYGPkhGe5bFfhL_flLayedRd3N1o09tPihw',
      authorId: user1.id,
      communityId: community1.id,
    },
    {
      content: 'Post about Node.js',
      photo: 'https://andrewbeeken.co.uk/wp-content/uploads/2018/11/nodejs.jpg?w=816',
      authorId: user1.id,
      communityId: community1.id,
    },
    {
      content: 'Post about Cybersecurity',
      photo: 'https://ritmee.co.id/wp-content/uploads/2023/11/Penetration-Testing.png',
      authorId: user1.id,
      communityId: community1.id,
    },
    {
      content: 'Post about Esports',
      photo: 'https://www.mldspot.com/storage/generated/June2021/Akhirnya-Mobile-Legends-Masuk-eSports-2019.jpg',
      authorId: user2.id,
      communityId: community2.id,
    },
  ];

  for (const post of posts) {
    await prisma.post.create({
      data: post,
    });
  }

  console.log('Dummy posts and community followers created!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });