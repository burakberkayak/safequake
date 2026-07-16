import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Deprem başladığında kapalı bir alandaysanız ilk yapmanız gereken nedir?",
    options: [
      "Hemen merdivenlere veya asansöre koşmak",
      "Pencere kenarına gidip yardım beklemek",
      "Çök-Kapan-Tutun hareketini güvenli bir yerde uygulamak",
      "Balkona çıkıp yüksek sesle bağırmak"
    ],
    correctIndex: 2,
    explanation: "Deprem anında en güvenli hareket sağlam bir nesnenin yanında Çök-Kapan-Tutun hareketini uygulamaktır. Merdiven ve asansörler en tehlikeli alanlardır."
  },
  {
    id: 2,
    question: "Deprem sırasında başımızı korumak için hangi önlemi almalıyız?",
    options: [
      "Başımızı kollarımızla veya yastık gibi bir nesneyle kapatmalıyız",
      "Ayakta dik durup tavana bakmalıyız",
      "Hemen yatağın altına girmeliyiz",
      "Kapı eşiğinde beklemeliyiz"
    ],
    correctIndex: 0,
    explanation: "Başımızı kollarımız veya koruyucu bir nesneyle (yastık vb.) kapatıp çökerek korumalıyız. Yatakların altına girmek yerine yanındaki boşlukta (yaşam üçgeni) durulmalıdır."
  },
  {
    id: 3,
    question: "Deprem sarsıntısı bittikten sonra ne yapılmalıdır?",
    options: [
      "Hemen asansörle aşağı inilmelidir",
      "Gaz vanaları kapatılmalı, bina acil durum çantasıyla sakin bir şekilde tahliye edilmelidir",
      "Evdeki tüm pencereler kapatılmalıdır",
      "Eşyaların yerleri düzeltilmelidir"
    ],
    correctIndex: 1,
    explanation: "Sarsıntı bittiğinde olası yangınları önlemek için gaz/su vanaları kapatılmalı ve çanta alınarak toplanma alanına gidilmelidir."
  }
];

const QUIZ_QUESTIONS_EN: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the first thing you should do if you are indoors when an earthquake starts?",
    options: [
      "Immediately run to stairs or elevator",
      "Go to a window and wait for help",
      "Apply the Drop-Cover-Hold On move in a safe spot",
      "Go out on the balcony and scream loudly"
    ],
    correctIndex: 2,
    explanation: "During an earthquake, the safest move is to Drop-Cover-Hold On next to a sturdy object. Stairs and elevators are the most dangerous areas."
  },
  {
    id: 2,
    question: "Which precaution should we take to protect our head during an earthquake?",
    options: [
      "We should cover our head with our arms or an object like a pillow",
      "We should stand upright and look at the ceiling",
      "We should immediately get under the bed",
      "We should wait in the doorway"
    ],
    correctIndex: 0,
    explanation: "We should protect our head by covering it with our arms or a protective object (pillow etc.) and crouching. Instead of getting under beds, stand in the gap next to them (triangle of life)."
  },
  {
    id: 3,
    question: "What should be done after the earthquake shaking stops?",
    options: [
      "Immediately go down using the elevator",
      "Gas valves should be shut off, the building should be evacuated calmly with the emergency bag",
      "All windows in the house should be closed",
      "The positions of furniture should be corrected"
    ],
    correctIndex: 1,
    explanation: "When shaking stops, gas/water valves should be turned off to prevent potential fires, and we should proceed to the assembly area with the bag."
  }
];

export const EducationScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t, language } = useTranslation();
  const questions = language === 'tr' ? QUIZ_QUESTIONS : QUIZ_QUESTIONS_EN;
  
  // States
  const [points, setPoints] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(0); // 0: Çök, 1: Kapan, 2: Tutun
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(1));

  // Load points and badges
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const storedPoints = await AsyncStorage.getItem('edu_points');
        const storedBadges = await AsyncStorage.getItem('edu_badges');
        if (storedPoints) setPoints(parseInt(storedPoints));
        if (storedBadges) setUnlockedBadges(JSON.parse(storedBadges));
      } catch (err) {
        // Quiet fail
      }
    };
    loadProgress();
  }, []);

  const saveProgress = async (newPoints: number, newBadges: string[]) => {
    try {
      await AsyncStorage.setItem('edu_points', newPoints.toString());
      await AsyncStorage.setItem('edu_badges', JSON.stringify(newBadges));
    } catch (err) {
      // Quiet fail
    }
  };

  const handleStepChange = (index: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setActiveStep(index);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleAnswer = (optionIndex: number) => {
    if (selectedOptionIndex !== null) return; // Answered already
    setSelectedOptionIndex(optionIndex);
    setShowExplanation(true);
    
    if (optionIndex === questions[currentQuestionIndex]!.correctIndex) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOptionIndex(null);
    setShowExplanation(false);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz finished
      setQuizFinished(true);
      
      // Calculate reward
      const quizScore = score + (selectedOptionIndex === questions[currentQuestionIndex]!.correctIndex ? 1 : 0);
      const earnedPoints = quizScore * 50;
      const updatedPoints = points + earnedPoints;
      
      let updatedBadges = [...unlockedBadges];
      
      const badgeSage = language === 'tr' ? 'Deprem Bilgesi' : 'Earthquake Sage';
      const badgeFirst = language === 'tr' ? 'İlk Adım' : 'First Step';

      if (quizScore === questions.length && !updatedBadges.includes(badgeSage)) {
        updatedBadges.push(badgeSage);
        Alert.alert(
          language === 'tr' ? '🌟 Yeni Rozet!' : '🌟 New Badge!', 
          language === 'tr' 
            ? "Tebrikler, tüm soruları doğru cevaplayarak 'Deprem Bilgesi' rozetini kazandınız!" 
            : "Congratulations, you answered all questions correctly and won the 'Earthquake Sage' badge!"
        );
      } else if (!updatedBadges.includes(badgeFirst) && quizScore > 0) {
        updatedBadges.push(badgeFirst);
        Alert.alert(
          language === 'tr' ? '🌟 Yeni Rozet!' : '🌟 New Badge!', 
          language === 'tr' 
            ? "Tebrikler, 'İlk Adım' rozetini kazandınız!" 
            : "Congratulations, you earned the 'First Step' badge!"
        );
      }

      setPoints(updatedPoints);
      setUnlockedBadges(updatedBadges);
      saveProgress(updatedPoints, updatedBadges);
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setQuizFinished(false);
    setScore(0);
    setShowExplanation(false);
  };

  const steps = [
    {
      title: language === 'tr' ? '1. ÇÖK' : '1. DROP',
      description: language === 'tr' 
        ? 'Güvenli bir yerde (sağlam bir masanın yanında vb.) dizlerinizin üzerine çökün. Vücudunuzu olabildiğince küçültün.' 
        : 'Drop down onto your knees in a safe place (next to a sturdy table, etc.). Make yourself as small as possible.',
      icon: 'arrow-down-circle'
    },
    {
      title: language === 'tr' ? '2. KAPAN' : '2. COVER',
      description: language === 'tr' 
        ? 'Başınızı ve boynunuzu kollarınızla veya çevrenizdeki yastık gibi yumuşak bir cisimle koruyun.' 
        : 'Cover your head and neck with your arms or a soft object like a pillow around you.',
      icon: 'body-outline'
    },
    {
      title: language === 'tr' ? '3. TUTUN' : '3. HOLD ON',
      description: language === 'tr' 
        ? 'Sarsıntı bitene kadar masanın bacağına veya diğer sağlam bir eşyaya sıkıca tutunun.' 
        : 'Hold on to the leg of the table or another sturdy item until the shaking stops.',
      icon: 'hand-left-outline'
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Points & Badges Header */}
      <View style={[styles.pointsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.pointsHeader}>
          <Ionicons name="trophy" size={24} color="#FFD700" />
          <Text style={[styles.pointsTitle, { color: colors.onSurface }]}>
            {language === 'tr' ? 'Eğitim Puanı' : 'Education Score'}: <Text style={{ fontWeight: '900', color: colors.primary }}>{points} {t('eduScore')}</Text>
          </Text>
        </View>
        
        {/* Badges list */}
        <View style={styles.badgesContainer}>
          <Text style={[styles.badgesLabel, { color: colors.onSurfaceVariant }]}>{language === 'tr' ? 'Kazanılan Rozetler:' : 'Earned Badges:'}</Text>
          <View style={styles.badgesRow}>
            {unlockedBadges.length === 0 ? (
              <Text style={{ color: colors.onSurfaceVariant, fontStyle: 'italic', fontSize: 13 }}>
                {language === 'tr' ? 'Henüz rozet kazanılmadı. Testi çözerek ilk rozetini kazan!' : 'No badges earned yet. Solve the quiz to win your first badge!'}
              </Text>
            ) : (
              unlockedBadges.map((badge, idx) => (
                <View key={idx} style={[styles.badgeItem, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                  <Ionicons name="ribbon-outline" size={14} color={colors.primary} />
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{badge}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>

      {/* Interactive Step Guide (Çök Kapan Tutun) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
          {language === 'tr' ? 'Deprem Anında Hayati Hareketler' : 'Life-Saving Actions During an Earthquake'}
        </Text>
        
        <View style={styles.stepTabs}>
          {steps.map((step, idx) => (
            <TouchableOpacity 
              key={idx}
              style={[
                styles.stepTabButton, 
                { 
                  backgroundColor: activeStep === idx ? colors.primary : colors.surface,
                  borderColor: activeStep === idx ? colors.primary : colors.border
                }
              ]}
              onPress={() => handleStepChange(idx)}
            >
              <Text style={[styles.stepTabText, { color: activeStep === idx ? colors.onPrimary : colors.onSurface }]}>
                {step.title.split(' ')[1]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Animated.View style={[styles.stepContent, { opacity: fadeAnim, backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name={steps[activeStep]!.icon as any} size={48} color={colors.primary} />
          <Text style={[styles.stepContentTitle, { color: colors.onSurface }]}>{steps[activeStep]!.title}</Text>
          <Text style={[styles.stepContentDesc, { color: colors.onSurfaceVariant }]}>{steps[activeStep]!.description}</Text>
        </Animated.View>
      </View>

      {/* Mini Quiz Section */}
      <View style={[styles.section, { marginTop: 8 }]}>
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
          {language === 'tr' ? 'Mini Bilgi Yarışması' : 'Mini Trivia Quiz'}
        </Text>
        
        {!quizStarted ? (
          <View style={[styles.quizStartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="help-circle-outline" size={40} color={colors.primary} />
            <Text style={[styles.quizCardTitle, { color: colors.onSurface }]}>{language === 'tr' ? 'Bilgini Test Et' : 'Test Your Knowledge'}</Text>
            <Text style={[styles.quizCardDesc, { color: colors.onSurfaceVariant }]}>
              {language === 'tr' 
                ? 'Deprem anında doğru hareket etmeyi ne kadar iyi biliyorsun? 3 soruluk testi çöz, puanları ve rozetleri kazan!' 
                : 'How well do you know what to do during an earthquake? Complete the 3-question quiz to earn points and badges!'}
            </Text>
            <TouchableOpacity 
              style={[styles.startButton, { backgroundColor: colors.primary }]}
              onPress={() => setQuizStarted(true)}
            >
              <Text style={{ color: colors.onPrimary, fontWeight: 'bold' }}>{language === 'tr' ? 'Yarışmayı Başlat' : 'Start Quiz'}</Text>
            </TouchableOpacity>
          </View>
        ) : quizFinished ? (
          <View style={[styles.quizFinishedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.primary} />
            <Text style={[styles.quizCardTitle, { color: colors.onSurface }]}>{t('eduQuizFinished')}</Text>
            <Text style={[styles.quizCardDesc, { color: colors.onSurfaceVariant }]}>
              {language === 'tr' ? 'Doğru Sayısı' : 'Correct Answers'}: {score} / {questions.length}
            </Text>
            <Text style={[styles.quizPointsText, { color: colors.primary }]}>
              +{score * 50} {language === 'tr' ? 'Puan Kazanıldı!' : 'Points Earned!'}
            </Text>
            <TouchableOpacity 
              style={[styles.startButton, { backgroundColor: colors.primary }]}
              onPress={resetQuiz}
            >
              <Text style={{ color: colors.onPrimary, fontWeight: 'bold' }}>{t('eduRestart')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ACTIVE QUIZ QUESTION
          <View style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.questionProgress, { color: colors.onSurfaceVariant }]}>
              {language === 'tr' ? 'Soru' : 'Question'} {currentQuestionIndex + 1} / {questions.length}
            </Text>
            <Text style={[styles.questionText, { color: colors.onSurface }]}>
              {questions[currentQuestionIndex]!.question}
            </Text>

            <View style={styles.optionsList}>
              {questions[currentQuestionIndex]!.options.map((option, idx) => {
                const isSelected = selectedOptionIndex === idx;
                const isCorrect = idx === questions[currentQuestionIndex]!.correctIndex;
                let optionStyle = { borderColor: colors.border, backgroundColor: colors.background };
                let optionTextStyle = { color: colors.onSurface };

                if (selectedOptionIndex !== null) {
                  if (isCorrect) {
                    optionStyle = { borderColor: colors.green, backgroundColor: colors.greenContainer };
                    optionTextStyle = { color: colors.green };
                  } else if (isSelected) {
                    optionStyle = { borderColor: colors.red, backgroundColor: colors.redContainer };
                    optionTextStyle = { color: colors.red };
                  }
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.optionRow, optionStyle]}
                    onPress={() => handleAnswer(idx)}
                    disabled={selectedOptionIndex !== null}
                  >
                    <Text style={[styles.optionTextLabel, optionTextStyle]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {showExplanation && (
              <View style={[styles.explanationBox, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.explanationTitle, { color: colors.onSurface }]}>{language === 'tr' ? 'Açıklama:' : 'Explanation:'}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, lineHeight: 18 }}>
                  {questions[currentQuestionIndex]!.explanation}
                </Text>
                <TouchableOpacity 
                  style={[styles.nextButton, { backgroundColor: colors.primary }]}
                  onPress={handleNextQuestion}
                >
                  <Text style={{ color: colors.onPrimary, fontWeight: 'bold' }}>
                    {currentQuestionIndex === questions.length - 1 
                      ? (language === 'tr' ? 'Sonuçları Gör' : 'See Results') 
                      : (language === 'tr' ? 'Sıradaki Soru' : 'Next Question')}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.onPrimary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  pointsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  badgesContainer: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
    paddingTop: 8,
  },
  badgesLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  stepTabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  stepTabText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  stepContent: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
    minHeight: 180,
    justifyContent: 'center',
  },
  stepContentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepContentDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  quizStartCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
    textAlign: 'center',
  },
  quizFinishedCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  quizCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizCardDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  quizPointsText: {
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 4,
  },
  startButton: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  questionCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  questionProgress: {
    fontSize: 12,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
    marginBottom: 8,
  },
  optionsList: {
    gap: 8,
  },
  optionRow: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionTextLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  explanationBox: {
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  nextButton: {
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
});
