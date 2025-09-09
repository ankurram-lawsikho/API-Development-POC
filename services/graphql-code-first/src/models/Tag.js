const { EntitySchema } = require('typeorm');

const Tag = new EntitySchema({
  name: 'Tag',
  tableName: 'tags',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    name: {
      type: 'varchar',
      unique: true,
      nullable: false,
    },
    slug: {
      type: 'varchar',
      unique: true,
      nullable: false,
    },
    description: {
      type: 'text',
      nullable: true,
    },
    color: {
      type: 'varchar',
      default: '#007bff',
    },
    postCount: {
      type: 'integer',
      default: 0,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  relations: {
    posts: {
      target: 'Post',
      type: 'many-to-many',
      inverseSide: 'tags',
    },
  },
});

module.exports = Tag;
