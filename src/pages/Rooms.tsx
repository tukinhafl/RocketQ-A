import logoImg from "../assets/images/logo2.png"
import { Button } from "../components/Button"
import '../styles/room.scss'
import { RoomCode } from "../components/RoomCode"
import { useHistory, useParams } from "react-router-dom"
import { FormEvent, useEffect, useState } from "react"
import { useAuth } from "../hooks/useAuth"
import { database } from "../services/firebase"
import toast, { Toaster } from 'react-hot-toast'
import '../styles/toast.scss'
import { Question } from "../components/Question"
import { useRoom } from "../hooks/useRoom"
import { useTheme } from '../hooks/useTheme'

type RoomParams = {
  id: string;
}

export function Room() {
  const params = useParams<RoomParams>()
  const [newQuestion, setNewQuestion] = useState('')
  const roomId = params.id
  const { user, signOut, signInWithGoogle } = useAuth()
  const { title, questions } = useRoom(roomId)
  const { theme } = useTheme()
  const history = useHistory()
 
  useEffect(() => {
    const roomRef = database.ref(`rooms/${roomId}`)

    roomRef.get().then(room => {
      if (room.val().endedAt) {
        history.push('/')
      }
    })
    // eslint-disable-next-line
  }, [roomId])

  async function handleSendQuestion(event: FormEvent) {
    event.preventDefault()

    if (!user) {
      return
    }

    if (newQuestion.trim() === '') {
      return toast.error("Your question doesn't exist. Please write something.", {
        className: 'toast'
      });
    } else if (newQuestion.trim() !== '') {
      toast.success('Sendeed to hoster, wait for his answer.', {
        className: 'toast'
      })
    }

    const question = {
      content: newQuestion,
      author: {
        name: user.name,
        avatar: user.avatar
      },
      isHighlighted: false,
      isAnswered: false
    }

    await database.ref(`rooms/${roomId}/questions`).push(question)

    setNewQuestion('')
  }

  async function handleLikeQuestion(questionId: string, likeId: string | undefined) {
    if (likeId) {
      await database.ref(`rooms/${roomId}/questions/${questionId}/likes/${likeId}`).remove()
    } else {
      await database.ref(`rooms/${roomId}/questions/${questionId}/likes`).push({
        authorId: user?.id
      })
    }
  }

  return (
    <div id='page-room' className={theme}>
      <header className={theme}>
        <div className='content'>
          <img src={logoImg} alt="Rocket" />
          <div>
            <RoomCode code={roomId} />
            <button onClick={signOut} className={`${user ? 'sign-out' : 'sign-out-hidden'}  ${theme}`}>signOut</button>
          </div>
        </div>
      </header>

      <main className='content'>
        <div className='room-title'>
          <h1 className={theme}>Sala {title}</h1>
          {questions.length > 0 && <span className={theme}>{questions.length} pergunta(s)</span>}
        </div>

        <form onSubmit={handleSendQuestion}>
          <textarea className={theme}
            placeholder="O que você quer perguntar?"
            onChange={event => setNewQuestion(event.target.value)}
            value={newQuestion}
          />
          <div className="form-footer">
            {user ? (
              <div className='user-info'>
                <img src={user.avatar} alt={user.name} />
                <span className={theme}>{user.name}</span>
              </div>
            ) : (
              <span className={theme}>Para enviar uma pergunta, <button  onClick={signInWithGoogle} className={theme}>faça seu login</button>.</span>
            )}
            <Button type="submit" disabled={!user}>Enviar pergunta</Button>
            <Toaster />
          </div>
        </form>
        <div className="question-list">
          {questions.map(question => {
            return (
              <Question
                key={question.id}
                content={question.content}
                author={question.author}
                isAnswered={question.isAnswered}
                isHighlighted={question.isHighlighted}
              >
                { !question.isAnswered && (
                  <button
                    className={`like-button ${theme === 'light' ? 'light' : 'flames'} ${question.likeId ? 'liked' : ''}`}
                    type='button'
                    aria-label='Marcar como gostei'
                    onClick={() => handleLikeQuestion(question.id, question.likeId)}
                  >
                    {question.likeCount > 0 && <span className={theme}>{question.likeCount}</span>}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path className={theme} d="M7 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V13C2 12.4696 2.21071 11.9609 2.58579 11.5858C2.96086 11.2107 3.46957 11 4 11H7M14 9V5C14 4.20435 13.6839 3.44129 13.1213 2.87868C12.5587 2.31607 11.7956 2 11 2L7 11V22H18.28C18.7623 22.0055 19.2304 21.8364 19.5979 21.524C19.9654 21.2116 20.2077 20.7769 20.28 20.3L21.66 11.3C21.7035 11.0134 21.6842 10.7207 21.6033 10.4423C21.5225 10.1638 21.3821 9.90629 21.1919 9.68751C21.0016 9.46873 20.7661 9.29393 20.5016 9.17522C20.2371 9.0565 19.9499 8.99672 19.66 9H14Z" stroke="#737380" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </Question>
            )
          })}
        </div>
      </main>
    </div>
  )
}