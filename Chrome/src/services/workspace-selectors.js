function isVisible(item) {
  return !item?.isDeleted;
}

export function getVisibleProjects(data) {
  return (data?.projects ?? []).filter(isVisible);
}

export function getVisibleChanges(data) {
  return (data?.changes ?? []).filter(isVisible);
}

export function getVisibleNotes(data) {
  return (data?.mentionedNotes ?? []).filter(isVisible);
}

export function getVisibleChangesForProject(data, projectName) {
  return getVisibleChanges(data).filter((change) => change.project === projectName);
}

export function getVisibleNotesForChange(data, changeOrTitle) {
  const changeId = typeof changeOrTitle === "object" ? changeOrTitle?.id : null;
  const changeTitle = typeof changeOrTitle === "object" ? changeOrTitle?.title : changeOrTitle;
  return getVisibleNotes(data).filter((note) => note.changeId === changeId || note.change === changeTitle);
}
