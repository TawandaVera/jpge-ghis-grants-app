const grantCanonicalSchema = {
  name: 'grantCanonicalSchema',
  description: 'Canonical shape of an incoming grant signal at SOP-1 intake.',
  type: 'object',
  required: ['source', 'title', 'funder', 'deadline', 'amount'],
  properties: {
    source: {
      type: 'string',
      enum: ['grants.gov', 'manual', 'import', 'url', 'paste', 'file'],
    },
    title: {
      type: 'string',
      minLength: 3,
    },
    funder: {
      type: 'string',
      minLength: 2,
    },
    deadline: {
      type: 'string',
    },
    amount: {
      type: 'number',
      minimum: 1,
    },
    rfpText: {
      type: 'string',
    },
    url: {
      type: 'string',
    },
  },
};

export default grantCanonicalSchema;