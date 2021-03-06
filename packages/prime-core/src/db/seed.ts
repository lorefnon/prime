// tslint:disable no-require-imports no-var-requires no-console
require('dotenv').config();

// tslint:disable no-require-imports no-var-requires no-console await-promise
import * as faker from 'faker';

import { acl } from '../acl';
import { ContentEntry } from '../models/ContentEntry';
import { ContentType } from '../models/ContentType';
import { ContentTypeField } from '../models/ContentTypeField';
import { User } from '../models/User';
import { sequelize } from '../sequelize';
import { EntryTransformer } from '../utils/entryTransformer';
import { Settings } from '../models/Settings';

const entryTransformer = new EntryTransformer();

const debug = require('debug')('prime:seed');

// tslint:disable-next-line max-func-body-length
export const seed = async () => {

  await sequelize.sync();

  // Create sample user
  const user = await User.create({
    firstname: 'John',
    lastname: 'Doe',
    email: 'demo@local.me',
    password: 'demo'
  });

  // Create settings
  await Settings.create({
    data: {
      accessType: 'public', // 'private'
      previews: [],
      locales: [{
        id: 'en', // RFC-5646 (example: en, en-US)
        name: 'English (US)',
        flag: 'us',
        master: true,
      }],
    },
    userId: user.id,
  });

  debug('sample user %s', user.dataValues.id);

  // Create some ACLs
  debug('adding roles');
  await acl.addUserRoles(user.id, ['guest', 'sample-editor']);

  // ---

  debug('adding ContentType: %s', 'Author');
  const authorType = await ContentType.create({ title: 'Author', userId: user.id });
  const authorFields = [
    await ContentTypeField.create({ title: 'Name', name: 'name', type: 'string', isDisplay: true }),
    await ContentTypeField.create({ title: 'Bio', name: 'bio', type: 'string' }),
    await ContentTypeField.create({ title: 'Date test', name: 'dateTest', type: 'datetime' })
  ];
  await authorType.$add('fields', authorFields);


  // ---
  debug('adding ContentType: %s (template)', 'SEO');
  const seoType = await ContentType.create({ title: 'SEO', userId: user.id, isTemplate: true, groups: ['SEO'] });
  const seoFields = [
    await ContentTypeField.create({ title: 'Meta Title', name: 'metaTitle', type: 'string', group: 'SEO' }),
    await ContentTypeField.create({ title: 'Meta Description', name: 'metaDescription', type: 'string', options: { multiline: true }, group: 'SEO' }),
    await ContentTypeField.create({ title: 'Meta Image', name: 'metaImage', type: 'asset', group: 'SEO' }),
  ];
  await seoType.$add('fields', seoFields);

  // ---

  debug('adding ContentType: %s', 'Blog');
  const blogType = await ContentType.create({ title: 'Blog', userId: user.id, settings: { contentTypeIds: [seoType.id] } });
  const blogFields = [
    await ContentTypeField.create({
      title: 'Title',
      name: 'title',
      type: 'string',
      isDisplay: true,
    }),
    await ContentTypeField.create({
      title: 'Description',
      name: 'description',
      type: 'string'
    }),
    await ContentTypeField.create({
      title: 'Author',
      name: 'author',
      type: 'document',
      options: {
        contentTypeId: authorType.id
      }
    })
  ];

  const tagsField = await ContentTypeField.create({
    title: 'Tags',
    name: 'tags',
    type: 'group'
  });

  const tagsTagField = await ContentTypeField.create({
    title: 'Tag',
    name: 'tag',
    type: 'string',
    contentTypeFieldId: tagsField.id
  });

  blogFields.push(tagsField, tagsTagField);

  await blogType.$add('fields', blogFields);

  debug('acl: allow %s to do everything on %s', 'sample-editor', 'Blog');
  await acl.allow('sample-editor', `ContentType.${blogType.id}`, ['create', 'read', 'update', 'delete']);

  // Allow author to have blogs
  const blogConnectionField = await ContentTypeField.create({
    title: 'Blog',
    name: 'blog',
    type: 'document',
    options: { contentTypeId: blogType.id }
  });
  await authorType.$add('fields', [blogConnectionField]);

  // --- create some authors
  const authorIds: string[] = [];
  for (let i = 0; i < 15; i += 1) {
    const author = await ContentEntry.create({
      contentTypeId: authorType.id,
      isPublished: true,
      data: await entryTransformer.transformInput({
        name: faker.name.findName(),
        bio: faker.lorem.words(15),
        dateTest: faker.date.past(),
      }, authorType.id),
      userId: user.id,
    });
    if (author) {
      authorIds.push(author.entryId);
    }
  }

  // create some blog posts
  const blogIds: string[] = [];
  for (let i = 0; i < 45; i += 1) {
    const blog = await ContentEntry.create({
      contentTypeId: blogType.id,
      isPublished: true,
      data: await entryTransformer.transformInput({
        title: faker.lorem.lines(1),
        description: faker.lorem.paragraphs(),
        author: faker.random.arrayElement(authorIds),
        tags: [{ tag: faker.hacker.phrase() }, { tag: faker.hacker.phrase() }]
      }, blogType.id),
      userId: user.id,
    });
    if (blog) {
      blogIds.push(blog.entryId);
    }
  }

  const slice1 = await ContentType.create({
    title: 'Slice Test 1',
    isSlice: true,
    userId: user.id
  });
  await slice1.$add('fields', [await ContentTypeField.create({ title: 'Foo', name: 'foo', type: 'string' })]);
  // next slice type
  const slice2 = await ContentType.create({
    title: 'Slice Test 2',
    isSlice: true,
    userId: user.id
  });
  await slice2.$add('fields', [await ContentTypeField.create({ title: 'Bar', name: 'bar', type: 'string' })]);
  authorType.$add('fields', [
    await ContentTypeField.create({ title: 'Body', name: 'body', type: 'slice', options: { contentTypeIds: [slice1.id, slice2.id] }})
  ]);

  // Print ACL
  debug('print roles:');
  debug(await acl.whatResources('sample-editor'));

  // Done
  debug('seeding finished');

  return 1;
};

seed()
  .then(() => process.exit(0));
