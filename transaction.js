class Transaction {
  logs = [];
  store = null;

  static validateTask(task) {
    if (!task.hasOwnProperty('index')) {
      throw new Error('index property is missing')
    }
    if (!task.hasOwnProperty('meta')) {
      throw new Error('meta property is missing')
    }
    if (!task.meta.hasOwnProperty('title')) {
      throw new Error('Meta Title property is missing')
    }
    if (!task.meta.hasOwnProperty('description')) {
      throw new Error('Meta Description is missing')
    }
    if (typeof task.call !== 'function') {
      throw new Error('call property is missing or is not a function')
    }
    if (task.restore && typeof task.restore !== 'function') {
      throw new Error('restore property is not a function')
    }
  }

  validateScenario(scenario) {
    scenario.forEach((task) => {
      try {
        Transaction.validateTask(task);
      } catch (error) {
        this.saveErrorLog(task, error);
        throw new Error;
      }
    });
  }

  dispatch = async (scenario) => {
    this.validateScenario(scenario);

    const scenarioSorted = scenario.sort((a, b) => a.index - b.index);

    let restoreTasks = [];

    try {
      const callResults = this.call(scenarioSorted);

      for await (const result of callResults) {

        const {data, task} = result;

        if (!this.store) {
          this.store = {};
        }

        const storeBefore = {...this.store};
        this.setStore(data, task);

        this.saveLog({
          operation: {
            type: 'call',
            success: 'true',
          },
          index: task.index,
          meta: task.meta,
          storeBefore,
          storeAfter: {...this.store},
          error: null,
        });

        if (task.restore) {
          restoreTasks.unshift(task)
        }
      }
    } catch (error) {
      const restoreResults = this.restore(restoreTasks);

      for await (const result of restoreResults) {
        const {task} = result;

        this.saveLog({
          index: task.index,
          meta: task.meta,
          error: null,
        }, {
          operation: {
            type: 'restore',
            success: 'true',
          }
        });
      }

      this.clearStore();

      throw new Error;
    }
  };

  async* call(scenarioSorted) {
    for (const task of scenarioSorted) {
      try {
        const data = await task.call(this.store);
        yield {data, task};
      } catch (error) {
        this.saveErrorLog(task, error, {
          operation: {
            type: 'call',
            success: 'false',
          },
        });
        throw new Error;
      }
    }
  }

  async* restore(restoreTasks) {
    for (const task of restoreTasks) {
      try {
        await task.restore(this.store);
        yield {task};
      } catch (error) {
        this.saveErrorLog(task, error, {
          operation: {
            type: 'restore',
            success: 'false',
          },
        });
        throw new Error;
      }
    }
  }

  clearStore() {
    this.store = null;
  }

  setStore(data, task) {
    this.store[task.index] = {
      title: task.meta.title,
      data: data
    };
  }

  saveErrorLog(task, error, operation) {
    this.logs.push({
      ...operation,
      index: task.index,
      meta: task.meta,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    })
  }

  saveLog(log, operation) {
    this.logs.push({
      ...operation,
      ...log
    })
  }
}

module.exports = Transaction;
