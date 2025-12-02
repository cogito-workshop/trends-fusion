import { prisma } from '../src/db/client.js';

describe('Database Connection', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to database successfully', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
  });

  it('should create and retrieve a template', async () => {
    const template = await prisma.template.create({
      data: {
        name: 'Test Template',
        platform: 'test',
        style: 'default',
        content: 'Test content',
      },
    });

    expect(template).toBeDefined();
    expect(template.name).toBe('Test Template');

    const retrieved = await prisma.template.findUnique({
      where: { id: template.id },
    });

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Test Template');

    await prisma.template.delete({
      where: { id: template.id },
    });
  });

  it('should create and retrieve a data source', async () => {
    const dataSource = await prisma.dataSource.create({
      data: {
        platform: 'twitter',
        identifier: 'https://twitter.com/test',
      },
    });

    expect(dataSource).toBeDefined();
    expect(dataSource.platform).toBe('twitter');

    const retrieved = await prisma.dataSource.findUnique({
      where: { id: dataSource.id },
    });

    expect(retrieved).toBeDefined();
    expect(retrieved?.platform).toBe('twitter');

    await prisma.dataSource.delete({
      where: { id: dataSource.id },
    });
  });
});
