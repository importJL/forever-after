import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { setUserRole as setUserRoleFn } from '../functions/set-user-role/resource';

const schema = a.schema({
  RsvpStatus: a.enum(['pending', 'accepted', 'declined', 'maybe']),
  GuestRole: a.enum(['guest', 'bridesmaid', 'groomsman', 'family', 'officiant']),
  TaskPriority: a.enum(['low', 'medium', 'high', 'urgent']),
  TaskStatus: a.enum(['todo', 'in_progress', 'done', 'cancelled']),
  VendorStatus: a.enum(['considering', 'booked', 'confirmed', 'cancelled']),
  MediaType: a.enum(['image', 'video', 'link']),
  MediaCategory: a.enum(['inspiration', 'photo', 'video', 'mood_board']),
  WebLinkCategory: a.enum(['general', 'registry', 'venue', 'vendor', 'inspiration', 'travel']),
  NotificationType: a.enum(['info', 'warning', 'success', 'reminder']),
  TimelineCategory: a.enum(['ceremony', 'reception', 'photos', 'preparation', 'transport', 'other', 'cocktail', 'dinner', 'dancing']),
  ImportedFileType: a.enum(['docx', 'xlsx', 'pptx']),

  Wedding: a.model({
    coupleName: a.string().default('Our Wedding'),
    partner1: a.string().default(''),
    partner2: a.string().default(''),
    date: a.string().default(''),
    venue: a.string().default(''),
    venueAddress: a.string().default(''),
    ceremonyDate: a.string().default(''),
    ceremonyLocation: a.string().default(''),
    ceremonyAddress: a.string().default(''),
    theme: a.string().default('Classic Elegance'),
    guestCount: a.integer().default(0),
    budgetTotal: a.float().default(0),
    notes: a.string().default(''),
  }).authorization((allow) => [
    allow.groups(['admin', 'full']).to(['create', 'read', 'update', 'delete']),
    allow.groups(['readwrite']).to(['create', 'read', 'update']),
    allow.groups(['readonly']).to(['read']),
  ]),

  Guest: a.model({
    name: a.string().required(),
    email: a.string().default(''),
    phone: a.string().default(''),
    group: a.string().default('General'),
    rsvpStatus: a.ref('RsvpStatus'),
    mealPreference: a.string().default(''),
    dietaryNotes: a.string().default(''),
    plusOne: a.boolean().default(false),
    plusOneName: a.string().default(''),
    tableNumber: a.integer().default(0),
    seatNumber: a.integer().default(0),
    role: a.ref('GuestRole'),
    priority: a.integer().default(3),
    side: a.string().default(''),
    category: a.string().default(''),
    relationshipGroup: a.string().default(''),
    overseas: a.boolean().default(false),
    verbalAsked: a.boolean().default(false),
    adults: a.integer().default(1),
    children: a.integer().default(0),
    totalInParty: a.integer().default(1),
    address: a.string().default(''),
    giftReceived: a.string().default(''),
    thankYouSent: a.boolean().default(false),
    notes: a.string().default(''),
  }).authorization((allow) => [
    allow.groups(['admin', 'full']).to(['create', 'read', 'update', 'delete']),
    allow.groups(['readwrite']).to(['create', 'read', 'update']),
    allow.groups(['readonly']).to(['read']),
  ]),

  BudgetCategory: a.model({
    name: a.string().required(),
    icon: a.string().default('CircleDollarSign'),
    budgeted: a.float().default(0),
    spent: a.float().default(0),
    color: a.string().default('#e11d48'),
    sortOrder: a.integer().default(0),
    expenses: a.hasMany('BudgetExpense', 'categoryId'),
  }).authorization((allow) => [
    allow.groups(['admin', 'full']).to(['create', 'read', 'update', 'delete']),
    allow.groups(['readwrite']).to(['create', 'read', 'update']),
    allow.groups(['readonly']).to(['read']),
  ]),

  BudgetExpense: a.model({
    categoryId: a.id(),
    description: a.string().required(),
    amount: a.float().default(0),
    date: a.string().default(''),
    vendor: a.string().default(''),
    paid: a.boolean().default(false),
    notes: a.string().default(''),
    category: a.belongsTo('BudgetCategory', 'categoryId'),
  }).authorization((allow) => [
    allow.groups(['admin', 'full']).to(['create', 'read', 'update', 'delete']),
    allow.groups(['readwrite']).to(['create', 'read', 'update']),
    allow.groups(['readonly']).to(['read']),
  ]),

  Task: a.model({
    title: a.string().required(),
    description: a.string().default(''),
    category: a.string().default('General'),
    priority: a.ref('TaskPriority'),
    status: a.ref('TaskStatus'),
    dueDate: a.string().default(''),
    assignee: a.string().default(''),
    notes: a.string().default(''),
    sortOrder: a.integer().default(0),
  }).authorization((allow) => [
    allow.groups(['admin', 'full']).to(['create', 'read', 'update', 'delete']),
    allow.groups(['readwrite']).to(['create', 'read', 'update']),
    allow.groups(['readonly']).to(['read']),
  ]),

  Vendor: a.model({
    name: a.string().required(),
    category: a.string().default(''),
    contactPerson: a.string().default(''),
    email: a.string().default(''),
    phone: a.string().default(''),
    website: a.string().default(''),
    address: a.string().default(''),
    district: a.string().default(''),
    city: a.string().default('Hong Kong'),
    price: a.float().default(0),
    depositPaid: a.float().default(0),
    status: a.ref('VendorStatus'),
    rating: a.integer().default(0),
    notes: a.string().default(''),
    contractDate: a.string().default(''),
  }).authorization((allow) => [
    allow.groups(['admin', 'full']).to(['create', 'read', 'update', 'delete']),
    allow.groups(['readwrite']).to(['create', 'read', 'update']),
    allow.groups(['readonly']).to(['read']),
  ]),

  TimelineEvent: a.model({
    title: a.string().required(),
    description: a.string().default(''),
    eventDate: a.string().default(''),
    startTime: a.string().required(),
    endTime: a.string().default(''),
    location: a.string().default(''),
    category: a.ref('TimelineCategory'),
    notes: a.string().default(''),
    sortOrder: a.integer().default(0),
  }).authorization((allow) => [
    allow.groups(['admin', 'full']).to(['create', 'read', 'update', 'delete']),
    allow.groups(['readwrite']).to(['create', 'read', 'update']),
    allow.groups(['readonly']).to(['read']),
  ]),

  MediaItem: a.model({
    title: a.string().default(''),
    type: a.ref('MediaType'),
    url: a.string().default(''),
    thumbnail: a.string().default(''),
    category: a.ref('MediaCategory'),
    notes: a.string().default(''),
    sortOrder: a.integer().default(0),
  }).authorization((allow) => [
    allow.groups(['admin', 'full']).to(['create', 'read', 'update', 'delete']),
    allow.groups(['readwrite']).to(['create', 'read', 'update']),
    allow.groups(['readonly']).to(['read']),
  ]),

  WebLink: a.model({
    title: a.string().required(),
    url: a.string().required(),
    description: a.string().default(''),
    category: a.ref('WebLinkCategory'),
    icon: a.string().default('Link'),
    sortOrder: a.integer().default(0),
  }).authorization((allow) => [
    allow.groups(['admin', 'full']).to(['create', 'read', 'update', 'delete']),
    allow.groups(['readwrite']).to(['create', 'read', 'update']),
    allow.groups(['readonly']).to(['read']),
  ]),

  Notification: a.model({
    title: a.string().required(),
    message: a.string().required(),
    type: a.ref('NotificationType'),
    read: a.boolean().default(false),
    relatedTo: a.string().default(''),
    recipients: a.string().array(),
    link: a.string().default(''),
  }).authorization((allow) => [
    allow.groups(['admin', 'full']).to(['create', 'read', 'update', 'delete']),
    allow.groups(['readwrite']).to(['create', 'read', 'update']),
    allow.groups(['readonly']).to(['read']),
  ]),

  ImportedFile: a.model({
    fileName: a.string().required(),
    fileType: a.ref('ImportedFileType'),
    content: a.string().default(''),
    parsedData: a.string().default(''),
    targetModule: a.string().default(''),
  }).authorization((allow) => [
    allow.groups(['admin', 'full']).to(['create', 'read', 'update', 'delete']),
    allow.groups(['readwrite']).to(['create', 'read', 'update']),
    allow.groups(['readonly']).to(['read']),
  ]),

  Member: a.model({
    userId: a.string().required(),
    email: a.string().default(''),
    firstName: a.string().default(''),
    lastName: a.string().default(''),
    role: a.string().default('readwrite'),
  }).authorization((allow) => [
    allow.ownerDefinedIn('userId').to(['create', 'read', 'update']),
    allow.group('admin').to(['create', 'read', 'update', 'delete']),
  ]),

  setUserRole: a
    .mutation()
    .arguments({ userId: a.string(), role: a.string(), userPoolId: a.string() })
    .returns(a.json())
    .authorization((allow) => [allow.group('admin')])
    .handler(a.handler.function(setUserRoleFn)),

}).authorization((allow) => []);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
