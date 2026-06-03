const grantCanonicalSchema = {
  name: 'grantCanonicalSchema',
  description: 'Canonical shape of an incoming grant signal at SOP-1 intake.',
  properties: {
    source: {
      type: 'string',
      enum: ['grants.gov', 'manual', 'import', 'url', 'paste', 'file'],
      required: true,
    },
    title: {
      type: 'string',
      minLength: 3,
      required: true,
    },
    funder: {
      type: 'string',
      minLength: 2,
      required: true,
    },
    deadline: {
      type: 'string',
      format: 'date',
      required: true,
    },
    amount: {
      type: 'number',
      min: 1,
      required: true,
    },
    rfpText: {
      type: 'string',
      required: false,
    },
    url: {
      type: 'string',
      format: 'url',
      required: false,
    },
  },
};

export default grantCanonicalSchema;
