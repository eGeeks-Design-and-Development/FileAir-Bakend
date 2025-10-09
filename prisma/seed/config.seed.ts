import { Prisma, PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

export const configVariables = {
  internal: {
    jwtSecret: {
      type: 'string',
      value: crypto.randomBytes(256).toString('base64'),
      locked: true,
    },
  },

  general: {
    appName: { type: 'string', defaultValue: 'File Air', secret: false },
    appUrl: { type: 'string', defaultValue: 'http://localhost:3000', secret: false },
    secureCookies: { type: 'boolean', defaultValue: 'false' },
    showHomePage: { type: 'boolean', defaultValue: 'true', secret: false },
    sessionDuration: { type: 'timespan', defaultValue: '3 months', secret: false },
  },

  share: {
    allowRegistration: { type: 'boolean', defaultValue: 'true', secret: false },
    allowUnauthenticatedShares: { type: 'boolean', defaultValue: 'false', secret: false },
    maxExpiration: { type: 'timespan', defaultValue: '0 days', secret: false },
    shareIdLength: { type: 'number', defaultValue: '8', secret: false },
    maxSize: { type: 'filesize', defaultValue: '1000000000', secret: false },
    zipCompressionLevel: { type: 'number', defaultValue: '9' },
    chunkSize: { type: 'filesize', defaultValue: '10000000', secret: false },
    autoOpenShareModal: { type: 'boolean', defaultValue: 'false', secret: false },
  },

  cache: {
    'redis-enabled': { type: 'boolean', defaultValue: 'false' },
    'redis-url': { type: 'string', defaultValue: 'redis://pingvin-redis:6379', secret: true },
    ttl: { type: 'number', defaultValue: '60' },
    maxItems: { type: 'number', defaultValue: '1000' },
  },

  email: {
    enableShareEmailRecipients: { type: 'boolean', defaultValue: 'false', secret: false },
    shareRecipientsSubject: { type: 'string', defaultValue: 'Files shared with you' },
    shareRecipientsMessage: {
      type: 'text',
      defaultValue:
        'Hey!\n\n{creator} ({creatorEmail}) shared some files with you. You can view or download the files with this link: {shareUrl}\n\nThe share will expire {expires}.\n\nNote: {desc}\n\nShared securely with File Air 🐧',
    },
    reverseShareSubject: { type: 'string', defaultValue: 'Reverse share link used' },
    reverseShareMessage: {
      type: 'text',
      defaultValue:
        'Hey!\n\nA share was just created with your reverse share link: {shareUrl}\n\nShared securely with File Air 🐧',
    },
    resetPasswordSubject: { type: 'string', defaultValue: 'File Air password reset' },
    resetPasswordMessage: {
      type: 'text',
      defaultValue:
        'Hey!\n\nYou requested a password reset. Click this link to reset your password: {url}\nThe link expires in an hour.\n\nFile Air 🐧',
    },
    inviteSubject: { type: 'string', defaultValue: 'File Air invite' },
    inviteMessage: {
      type: 'text',
      defaultValue:
        'Hey!\n\nYou were invited to File Air. Click this link to accept the invite: {url}\n\nYou can use the email "{email}" and the password "{password}" to sign in.\n\nFile Air 🐧',
    },
  },

  smtp: {
    enabled: { type: 'boolean', defaultValue: 'false', secret: false },
    allowUnauthorizedCertificates: { type: 'boolean', defaultValue: 'false', secret: false },
    host: { type: 'string', defaultValue: '' },
    port: { type: 'number', defaultValue: '0' },
    email: { type: 'string', defaultValue: '' },
    username: { type: 'string', defaultValue: '' },
    password: { type: 'string', defaultValue: '', obscured: true },
  },

  ldap: {
    enabled: { type: 'boolean', defaultValue: 'false', secret: false },
    url: { type: 'string', defaultValue: '' },
    bindDn: { type: 'string', defaultValue: '' },
    bindPassword: { type: 'string', defaultValue: '', obscured: true },
    searchBase: { type: 'string', defaultValue: '' },
    searchQuery: { type: 'string', defaultValue: '' },
    adminGroups: { type: 'string', defaultValue: '' },
    fieldNameMemberOf: { type: 'string', defaultValue: 'memberOf' },
    fieldNameEmail: { type: 'string', defaultValue: 'userPrincipalName' },
  },

  oauth: {
    allowRegistration: { type: 'boolean', defaultValue: 'true' },
    ignoreTotp: { type: 'boolean', defaultValue: 'true' },
    disablePassword: { type: 'boolean', defaultValue: 'false', secret: false },
    'github-enabled': { type: 'boolean', defaultValue: 'false' },
    'github-clientId': { type: 'string', defaultValue: '' },
    'github-clientSecret': { type: 'string', defaultValue: '', obscured: true },
    'google-enabled': { type: 'boolean', defaultValue: 'false' },
    'google-clientId': { type: 'string', defaultValue: '' },
    'google-clientSecret': { type: 'string', defaultValue: '', obscured: true },
    'microsoft-enabled': { type: 'boolean', defaultValue: 'false' },
    'microsoft-tenant': { type: 'string', defaultValue: 'common' },
    'microsoft-clientId': { type: 'string', defaultValue: '' },
    'microsoft-clientSecret': { type: 'string', defaultValue: '', obscured: true },
    'discord-enabled': { type: 'boolean', defaultValue: 'false' },
    'discord-clientId': { type: 'string', defaultValue: '' },
    'discord-clientSecret': { type: 'string', defaultValue: '', obscured: true },
    'oidc-enabled': { type: 'boolean', defaultValue: 'false' },
    'oidc-discoveryUri': { type: 'string', defaultValue: '' },
    'oidc-signOut': { type: 'boolean', defaultValue: 'false' },
    'oidc-scope': { type: 'string', defaultValue: 'openid email profile' },
    'oidc-clientId': { type: 'string', defaultValue: '' },
    'oidc-clientSecret': { type: 'string', defaultValue: '', obscured: true },
  },

  s3: {
    enabled: { type: 'boolean', defaultValue: 'false' },
    endpoint: { type: 'string', defaultValue: '' },
    region: { type: 'string', defaultValue: '' },
    bucketName: { type: 'string', defaultValue: '' },
    bucketPath: { type: 'string', defaultValue: '' },
    key: { type: 'string', defaultValue: '', secret: true },
    secret: { type: 'string', defaultValue: '', obscured: true },
    useChecksum: { type: 'boolean', defaultValue: 'true' },
  },

  legal: {
    enabled: { type: 'boolean', defaultValue: 'false', secret: false },
    imprintText: { type: 'text', defaultValue: '', secret: false },
    imprintUrl: { type: 'string', defaultValue: '', secret: false },
    privacyPolicyText: { type: 'text', defaultValue: '', secret: false },
    privacyPolicyUrl: { type: 'string', defaultValue: '', secret: false },
  },
} satisfies ConfigVariables;

/**
 * Updated YamlConfig typing to support booleans and your new keys.
 */
export type YamlConfig = {
  [Category in keyof typeof configVariables]: {
    [Key in keyof (typeof configVariables)[Category]]:
      | string
      | boolean
      | number
      | null;
  };
} & {
  initUser?: {
    enabled: boolean;
    username: string;
    email: string;
    password: string;
    isAdmin: boolean;
    ldapDN?: string;
  };
  migrate?: {
    enabled: boolean;
  };
};

type ConfigVariables = {
  [category: string]: {
    [variable: string]: Omit<
      Prisma.ConfigCreateInput,
      'name' | 'category' | 'order'
    >;
  };
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        'file:../data/pingvin-share.db?connection_limit=1',
    },
  },
});

async function seedConfigVariables() {
  for (const [category, configVariablesOfCategory] of Object.entries(
    configVariables,
  )) {
    let order = 0;
    for (const [name, properties] of Object.entries(
      configVariablesOfCategory,
    )) {
      const existingConfigVariable = await prisma.config.findUnique({
        where: { name_category: { name, category } },
      });

      if (!existingConfigVariable) {
        await prisma.config.create({
          data: {
            order,
            name,
            ...properties,
            category,
          },
        });
      }
      order++;
    }
  }
}

async function migrateConfigVariables() {
  const existingConfigVariables = await prisma.config.findMany();
  for (const existing of existingConfigVariables) {
    const configVariable =
      configVariables[existing.category]?.[existing.name];

    if (!configVariable) {
      await prisma.config.delete({
        where: {
          name_category: {
            name: existing.name,
            category: existing.category,
          },
        },
      });
    } else {
      const order = Object.keys(configVariables[existing.category]).indexOf(
        existing.name,
      );
      await prisma.config.update({
        where: {
          name_category: {
            name: existing.name,
            category: existing.category,
          },
        },
        data: {
          ...configVariable,
          name: existing.name,
          category: existing.category,
          value: existing.value,
          order,
        },
      });
    }
  }
}

seedConfigVariables()
  .then(() => migrateConfigVariables())
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
