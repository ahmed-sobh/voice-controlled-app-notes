if (!(window.speechRecognition || window.webkitSpeechRecognition)) {
  const app = document.querySelector('.app')
  const noBrowserSupport = document.querySelector('.no-browser-support')

  app.classList.add('hide')
  noBrowserSupport.classList.remove('hide')
  throw new Error('Sorry, Your Browser Doesn\'t Support the Web Speech API. Try Opening This Demo In Google Chrome.')
}


let noteContent = ''.trim()

// DOM Elements
const startRecordBtn = document.querySelector('.start-record-btn')
const pauseRecordBtn = document.querySelector('.pause-record-btn')
const saveNoteBtn = document.querySelector('.save-note-btn')
const recordingInstructions = document.querySelector('.recording-instructions')
const noteTextArea = document.querySelector('.note-textarea')
const notes = document.querySelector('.notes')

// Initialize the app
init()


/*-------------------------
      Speech Recognition
---------------------------*/

const speechRecognition = window.speechRecognition || window.webkitSpeechRecognition
const recognition = new speechRecognition()
// console.log('Your browser supports the web speech api.')

// console.log(recognition)

recognition.continuous = true

recognition.onstart = function () {
  changeContent('Voice recognition activated. Try speaking into the microphone.')
  console.log('Recognition starts')
}

recognition.onspeechend = function () {
  changeContent('You were quiet for a while so voice recognition turned itself off.')
  console.log('Recognition ends')
}

recognition.onerror = function (event) {
  console.log('Something went wrong', event.error)
  const error = event.error

  if (error === 'network') changeContent('It seems to be a problem with the internet connection.')
  else if (error === 'no-speech') changeContent('No speech was detected. Try again.')
}

// recognition.onend = function () {
//   changeContent('Voice recognition paused.')
// }
recognition.onresult = function (event) {
  // console.log(event.results)
  const currentElement = event.results[event.results.length - 1][0].transcript

  // console.log(currentElement)

  if (currentElement.trim() === 'clear' && noteContent !== '') {
    noteTextArea.value = ''
    noteContent = ''
    changeContent('Textarea is cleared successfully.')
    return
  } else if (currentElement.trim() === 'save') {
    addNote(event)
    return
  } else if (currentElement.trim() === 'pause') {
    pauseRecognition(event)
    return
  }

  noteContent += currentElement
  // console.log(noteContent)
  noteTextArea.value = noteContent.trim()
}

/*------------------------
      Speech Synthesis
--------------------------*/

function readOutLoud(content) {
  const speech = new SpeechSynthesisUtterance()

  speech.text = content
  speech.volume = 1
  speech.rate = 1
  speech.pitch = 1

  window.speechSynthesis.speak(speech)
}

/*-------------------------------
        App buttons and input
---------------------------------*/

startRecordBtn.addEventListener('click', e => {
  e.preventDefault()
  recognition.start()
  if (noteTextArea.value) noteContent += ' '
})

pauseRecordBtn.addEventListener('click', pauseRecognition)

saveNoteBtn.addEventListener('click', addNote)

notes.addEventListener('click', e => {
  e.preventDefault()
  const target = e.target

  if (target.matches('.listen-note')) {
    readOutLoud(target.parentNode.parentNode.querySelector('.content').textContent)
  } else if (target.matches('.delete-note')) {
    deleteNote(target.parentNode.parentNode)
  }

})

// sync the text inside the text area with the noteContent variable
noteTextArea.addEventListener('keyup', () => {
  noteContent = noteTextArea.value
})

/*-----------------------
      Helper Functions
-------------------------*/

function changeContent(noteContent) {
  recordingInstructions.textContent = noteContent
}

function saveNote(dateTime, content) {
  localStorage.setItem(`note-${dateTime}`, content)
}

function getAllNotes() {
  const notes = []
  let key

  for (let i = 0; i < localStorage.length; i++){
    key = localStorage.key(i)

    if (key.startsWith('note-')) {
      const dateTime = key.substr(key.indexOf('-') + 1, key.length)
      const content = localStorage.getItem(key)
      const note = {dateTime, content}

      notes.push(note)
      
    }
  }

  return notes
}


function renderNotes(notesArr) {
  let html = ''
  notesArr.forEach(note => {
    html += `<li class="note mb-2" data-key=${note.dateTime}>

            <div class="header">
              <span class="date">${note.dateTime}</span>
              <a href="#" class="listen-note">listen to note</a>
              <a href="#" class="delete-note">delete</a>
            </div>

            <p class="content">${note.content}</p>
          </li>`
  })
  
  notes.innerHTML = html

}

function deleteNote(child) {
 const key =  child.querySelector('.date').textContent
  // var key = child.getAttribute('data-key')
  localStorage.removeItem(`note-${key}`)
  child.parentNode.removeChild(child)
}

function addNote(e) {
  e.preventDefault()
  recognition.stop()

  if (!noteContent) {
    changeContent('Could not save empty note. Please add a message to your note.')
    return
  }

  // Save note to localStorage.
  // The key is the dateTime with seconds, the value is the content of the note.
  saveNote(new Date().toLocaleString(), noteContent)

  // Reset variables and update UI.
  noteContent = ''
  noteTextArea.value = ''

  const notes = getAllNotes()

  renderNotes(notes)

  changeContent('Note saved successfully.')
}

function pauseRecognition(e) {
  e.preventDefault()
  recognition.stop()
  changeContent('Voice recognition paused.')
}

// To initialize the entire app
function init() {
  const notes = getAllNotes()
  // console.log(notes.length)
  if (!notes.length) notes.innerHTML = `<li class="note"><p class="content">You don't have any notes yet.</p></li>`
  else renderNotes(notes)
}