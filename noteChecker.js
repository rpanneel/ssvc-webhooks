const PORTAL_NOTE_TYPE = 'ZPOR'

function areArraysEqual(arr1, arr2) {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
}

export const getNewPortalNotes = (oldNotes, newNotes) => {
    if (areArraysEqual(oldNotes, newNotes)) {
        console.log(`Notes are exactly the same`)
        return []
    }

    return newNotes.filter(newNote => newNote.noteType === PORTAL_NOTE_TYPE && !oldNotes.some(oldNote => newNote.id === oldNote.id))
}