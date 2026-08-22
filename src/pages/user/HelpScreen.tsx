import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, LayoutAnimation, Platform } from 'react-native';
import { HelpIcon } from '../../components/common/Icons';


const FAQ_DATA = [
  {
    question: 'How does anonymity work on Man Ki Aavaj?',
    answer: 'Your real full name, phone number, and email address are strictly private and never displayed publicly. Only your selected anonymous handle is visible to other members.',
    category: 'Privacy & Security',
  },
  {
    question: 'How do I choose or change my handle?',
    answer: 'Handles are selected during profile setup. They are designed to keep your real identity fully hidden while allowing others to recognize your thoughts.',
    category: 'Account & Handle',
  },
  {
    question: 'How do I post a thought?',
    answer: 'Navigate to any topic channel from the home page, tap "+ Add Your Thought", write your post content, and publish. You can also attach pictures or record voice notes!',
    category: 'Posting & Content',
  },
  {
    question: 'How is content moderated on the app?',
    answer: 'To protect our community, Man Ki Aavaj utilizes automatic AI moderation to scan posts and comments for harassment, hate speech, or abuse. Blocked content is sent to moderators for review.',
    category: 'Discussion Stream',
  },
  {
    question: 'Can I delete my thoughts or comments?',
    answer: 'Yes, you have full control over your content. You can delete any of your published thoughts or comments directly from your Profile screen.',
    category: 'Posting & Content',
  },
];

const CATEGORIES = [
  { id: 'account', title: 'Account & Handle', description: 'Handle selection, email verification, passwords.', icon: '👤' },
  { id: 'privacy', title: 'Privacy & Security', description: 'Identity shielding, search indexing, privacy options.', icon: '🛡️' },
  { id: 'posting', title: 'Posting & Content', description: 'Publishing thoughts, voice-to-text, post deletion.', icon: '📝' },
  { id: 'discussion', title: 'Discussion Stream', description: 'Topic channels, safety controls, shielding.', icon: '💬' },
];

export function HelpScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const toggleExpand = (index: number) => {
    if (Platform.OS === 'ios') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const filteredFAQs = FAQ_DATA.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerTitleRow}>
          <HelpIcon color="#FFD1E8" size={24} />
          <Text style={styles.bannerTitle}>Help & Support Center</Text>
        </View>
        <Text style={styles.bannerSubtitle}>Find answers, safety guidelines, and support.</Text>

        {/* Banner Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search help topics and FAQs..."
            placeholderTextColor="#8C8385"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setExpandedIndex(null);
            }}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Category Row Cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {selectedCategory && (
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text style={styles.clearFilterText}>Clear filter</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 106, marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.title;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedCategory(isSelected ? null : cat.title);
                  setExpandedIndex(null);
                }}
                style={[
                  styles.categoryCard,
                  isSelected && { borderColor: '#6F405F', backgroundColor: 'rgba(111, 64, 95, 0.05)' },
                ]}
              >
                <View style={styles.categoryIconRow}>
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={styles.categoryCardTitle} numberOfLines={1}>{cat.title}</Text>
                </View>
                <Text style={styles.categoryDesc}>{cat.description}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Frequently Asked Questions */}
      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      
      {filteredFAQs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No FAQs found matching your criteria.</Text>
        </View>
      ) : (
        filteredFAQs.map((faq, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <View key={faq.question} style={styles.faqCard}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleExpand(index)}
                style={styles.faqHeader}
              >
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqArrow}>{isExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={styles.faqBody}>
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{faq.category}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F4',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: '#6F405F',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 20,
    shadowColor: '#2D1D15',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#FFD1E8',
    marginBottom: 16,
    fontWeight: '600',
  },
  searchContainer: {
    position: 'relative',
    width: '100%',
  },
  searchInput: {
    width: '100%',
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#2D1D15',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2D1D15',
    marginLeft: 16,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6F405F',
    marginBottom: 12,
  },
  categoryScroll: {
    paddingLeft: 12,
    paddingRight: 20,
    gap: 12,
    height: 96,
  },
  categoryCard: {
    width: 190,
    height: 84,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EFEAE8',
    padding: 10,
    justifyContent: 'center',
  },
  categoryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryIcon: {
    fontSize: 15,
  },
  categoryCardTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#2D1D15',
    flex: 1,
  },
  categoryDesc: {
    fontSize: 9.5,
    color: '#8C8385',
    lineHeight: 13,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#EFEAE8',
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2D1D15',
    flex: 1,
    paddingRight: 12,
  },
  faqArrow: {
    fontSize: 10,
    color: '#8C8385',
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F8F5F4',
    paddingTop: 10,
  },
  faqAnswer: {
    fontSize: 12.5,
    color: '#5C5254',
    lineHeight: 18,
    marginBottom: 10,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(111, 64, 95, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6F405F',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#8C8385',
  },
});
