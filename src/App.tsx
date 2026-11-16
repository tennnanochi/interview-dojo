import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { HomeScreen } from './screens/HomeScreen'
import { CaseBankScreen } from './screens/CaseBankScreen'
import { CardListScreen } from './screens/CardListScreen'
import { RecordsScreen } from './screens/RecordsScreen'
import { StudyScreen } from './screens/StudyScreen'
import { FermiExerciseScreen } from './screens/FermiExerciseScreen'
import { FermiListScreen } from './screens/FermiListScreen'
import { FermiReviewScreen } from './screens/FermiReviewScreen'
import { ImportScreen } from './screens/ImportScreen'
import { LoginScreen } from './screens/LoginScreen'

export function App() {
  return (
    <Routes>
      {/* 下部タブのある画面 */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/cards" element={<CardListScreen />} />
        <Route path="/fermi" element={<FermiListScreen />} />
        <Route path="/case" element={<CaseBankScreen />} />
        <Route path="/records" element={<RecordsScreen />} />
      </Route>
      {/* 出題中はタブを出さず、カードに集中する */}
      <Route path="/cards/study" element={<StudyScreen />} />
      <Route path="/fermi/:id" element={<FermiExerciseScreen />} />
      <Route path="/fermi/:id/review" element={<FermiReviewScreen />} />
      <Route path="/records/import" element={<ImportScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
