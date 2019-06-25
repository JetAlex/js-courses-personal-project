const Transaction = require('./transaction');

const scenario = [

  {
    index: 1,
    meta: {
      title: 'Read popular customers',
      description: 'This action is responsible for reading the most popular customers'
    },
    // callback который отвечает за основное действие этого шага
    call: async (store) => {
    },
    // callback который отвечает за откат этого шага,
    restore: async (store) => {
    }
  },
  {
    index: 2,
    meta: {
      title: 'Add customer',
      description: 'This action will add some customer'
    },
    // callback который отвечает за основное действие этого шага
    call: async (store) => {
    },
    // callback который отвечает за откат этого шага,
    restore: async (store) => {
    }
  },
];
const transaction = new Transaction();

(async () => {
  try {
    await transaction.dispatch(scenario);
    const store = transaction.store;
    console.log(store);
    const logs = transaction.logs;
    console.log(logs)
  } catch (err) {
    // Send email about broken transaction

    const logs = transaction.logs;
    console.log(logs)
    const store = transaction.store;
    console.log(store)
  }
})();
