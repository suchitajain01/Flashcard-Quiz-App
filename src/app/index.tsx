import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Pressable,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

const STORAGE_KEY = '@flashcards_data';

const DEFAULT_CARDS: Flashcard[] = [
  { id: '1', question: 'What is React Native?', answer: 'A framework for building native apps using React.' },
  { id: '2', question: 'What is AsyncStorage?', answer: 'An asynchronous, unencrypted, persistent key-value storage system for React Native.' },
  { id: '3', question: 'How do you navigate cards in this app?', answer: 'Use the Previous and Next buttons at the bottom!' },
];

export default function App() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [questionInput, setQuestionInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');

  // Load cards from AsyncStorage on app launch
  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setCards(JSON.parse(stored));
      } else {
        setCards(DEFAULT_CARDS);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CARDS));
      }
    } catch (e) {
      console.error('Failed to load flashcards', e);
    }
  };

  const saveCardsToStorage = async (newCards: Flashcard[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
    } catch (e) {
      console.error('Failed to save flashcards', e);
    }
  };

  // Navigation Handlers
  const handleNext = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
  };

  const handlePrevious = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + cards.length) % cards.length);
  };

  // Card Management Handlers
  const openAddModal = () => {
    setEditingCard(null);
    setQuestionInput('');
    setAnswerInput('');
    setModalVisible(true);
  };

  const openEditModal = (card: Flashcard) => {
    setEditingCard(card);
    setQuestionInput(card.question);
    setAnswerInput(card.answer);
    setModalVisible(true);
  };

  const handleSaveCard = () => {
    if (!questionInput.trim() || !answerInput.trim()) {
      Alert.alert('Validation Error', 'Please fill in both question and answer fields.');
      return;
    }

    let updatedCards: Flashcard[];
    if (editingCard) {
      updatedCards = cards.map((c) =>
        c.id === editingCard.id ? { ...c, question: questionInput, answer: answerInput } : c
      );
    } else {
      const newCard: Flashcard = {
        id: Date.now().toString(),
        question: questionInput,
        answer: answerInput,
      };
      updatedCards = [...cards, newCard];
    }

    setCards(updatedCards);
    saveCardsToStorage(updatedCards);
    setModalVisible(false);
  };

  const handleDeleteCard = (id: string) => {
    const updatedCards = cards.filter((c) => c.id !== id);
    setCards(updatedCards);
    saveCardsToStorage(updatedCards);
    if (currentIndex >= updatedCards.length && updatedCards.length > 0) {
      setCurrentIndex(updatedCards.length - 1);
    }
    setIsFlipped(false);
  };

  const currentCard = cards[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Flashcard Quiz App</Text>

      {/* Main Flashcard Display */}
      {cards.length > 0 && currentCard ? (
        <View style={styles.quizSection}>
          <Text style={styles.counterText}>
            Card {currentIndex + 1} of {cards.length}
          </Text>

          {/* Flip Interaction Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.card, isFlipped ? styles.cardBack : styles.cardFront]}
            onPress={() => setIsFlipped(!isFlipped)}
          >
            <Text style={styles.cardTag}>{isFlipped ? 'ANSWER' : 'QUESTION'}</Text>
            <Text style={styles.cardContent}>
              {isFlipped ? currentCard.answer : currentCard.question}
            </Text>
            <Text style={styles.flipHint}>Tap card to flip</Text>
          </TouchableOpacity>

          {/* Navigation Controls */}
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
              <Text style={styles.navButtonText}>← Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <Text style={styles.navButtonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No flashcards available. Create one below!</Text>
        </View>
      )}

      {/* Manage Cards Action Bar */}
      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addButtonText}>+ Create New Flashcard</Text>
      </TouchableOpacity>

      {/* Card List & Actions */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionHeader}>Deck Management</Text>
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.listQuestion}>
                  {item.question}
                </Text>
              </View>
              <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtnEdit}>
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteCard(item.id)} style={styles.actionBtnDelete}>
                <Text style={styles.actionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCard ? 'Edit Flashcard' : 'Create New Flashcard'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Question"
              value={questionInput}
              onChangeText={setQuestionInput}
              multiline
            />

            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Answer"
              value={answerInput}
              onChangeText={setAnswerInput}
              multiline
            />

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSaveCard}>
                <Text style={styles.btnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 40 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 12, color: '#1F2937' },
  quizSection: { alignItems: 'center' },
  counterText: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  card: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardFront: { backgroundColor: '#4F46E5' },
  cardBack: { backgroundColor: '#059669' },
  cardTag: { fontSize: 12, color: '#E0E7FF', fontWeight: 'bold', position: 'absolute', top: 12, left: 16 },
  cardContent: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
  flipHint: { fontSize: 11, color: '#E0E7FF', position: 'absolute', bottom: 12 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 16 },
  navButton: { backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  navButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  emptyContainer: { padding: 30, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6B7280' },
  addButton: { backgroundColor: '#2563EB', padding: 14, borderRadius: 10, alignItems: 'center', marginVertical: 16 },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  listContainer: { flex: 1 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#374151' },
  listItem: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center' },
  listQuestion: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  actionBtnEdit: { backgroundColor: '#F59E0B', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginLeft: 8 },
  actionBtnDelete: { backgroundColor: '#EF4444', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginLeft: 6 },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { backgroundColor: '#9CA3AF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  saveBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  btnText: { color: '#FFFFFF', fontWeight: 'bold' },
});