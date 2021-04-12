const timeMachineStatus = { add: 0, remove: 1 };

const fileMode = { readonly: 0, input: 1, select: 2 };

const viewMode = { navigate: 0, insert: 1, select: 2 };

const viewModeById = { };
for (let [ name, id ] of Object.entries(viewMode)) {
    viewModeById[id] = name;
}

module.exports = { viewMode, viewModeById, timeMachineStatus, fileMode };
