
import { createClient } from '@supabase/supabase-js';
import { HistoryItem, ProficiencyLevel, VocabularyItem, VocabMastery, SyncSource } from '../types';

const supabaseUrl = 'https://mfohviakctfcbelkyoql.supabase.co';
const supabaseKey = 'sb_publishable_F5CW_pZKh6kMXNrH5AmHrg_DV_Gbkgh';

export const supabase = createClient(supabaseUrl, supabaseKey);
export const DEV_USER_ID = 'user_dev_001';

// --- UTILIDADES DE PERSISTENCIA LOCAL (OFFLINE-FIRST) ---
const LOCAL_KEYS = {
  HISTORY: 'speaksync_local_history',
  PROFILE: 'speaksync_local_profile',
  VOCAB: 'speaksync_local_vocab',
  PROGRESS: 'speaksync_local_progress'
};

const saveLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));
const getLocal = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

// Auxiliar para manejo silencioso de errores de red
const silentFetch = async (promise: Promise<any>) => {
  try {
    const { data, error } = await promise;
    if (error) throw error;
    return data;
  } catch (e) {
    // Silenciamos los errores de fetch para que no aparezcan en la consola como errores fatales
    return null;
  }
};

// --- GESTIÓN DE PERFIL ---
export const fetchUserProfile = async () => {
  // 1. Intentar Cloud
  const cloudData = await silentFetch(supabase.from('profiles').select('*').eq('user_id', DEV_USER_ID).single());
  
  // 2. Si hay cloud, actualizar local y devolver
  if (cloudData) {
    saveLocal(LOCAL_KEYS.PROFILE, cloudData);
    return cloudData;
  }
  
  // 3. Si falla cloud, devolver local o default
  return getLocal(LOCAL_KEYS.PROFILE) || { user_id: DEV_USER_ID, xp: 0, credits: 50, level: 'A1', streak: 0 };
};

export const updateUserStats = async (updates: { xp?: number; streak?: number; level?: string; credits?: number }) => {
  const current = await fetchUserProfile();
  const newData = { ...current, ...updates, last_activity: new Date().toISOString() };
  
  // Guardar local inmediato
  saveLocal(LOCAL_KEYS.PROFILE, newData);
  
  // Sincronizar cloud en fondo
  await silentFetch(supabase.from('profiles').update(newData).eq('user_id', DEV_USER_ID));
};

// --- GESTIÓN DE HISTORIAL ---
export const saveHistoryItem = async (item: HistoryItem) => {
  // Local
  const localHistory = getLocal(LOCAL_KEYS.HISTORY) || [];
  saveLocal(LOCAL_KEYS.HISTORY, [item, ...localHistory].slice(0, 50));
  
  // Cloud
  await silentFetch(supabase.from('history').insert({
    id: item.id,
    topic: item.topic,
    level: item.level,
    content: item.content,
    timestamp: new Date(item.timestamp).toISOString(),
    source: item.source || SyncSource.AI_SYNC
  }));
};

export const fetchHistoryFromCloud = async (): Promise<HistoryItem[]> => {
  const cloudData = await silentFetch(supabase.from('history').select('*').order('timestamp', { ascending: false }));
  
  if (cloudData) {
    const formatted = cloudData.map((item: any) => ({ ...item, timestamp: new Date(item.timestamp).getTime() }));
    saveLocal(LOCAL_KEYS.HISTORY, formatted);
    return formatted;
  }
  
  return getLocal(LOCAL_KEYS.HISTORY) || [];
};

export const clearCloudHistory = async () => {
  localStorage.removeItem(LOCAL_KEYS.HISTORY);
  await silentFetch(supabase.from('history').delete().neq('id', 'placeholder'));
};

// --- BÓVEDA LÉXICA ---
export const saveVocabToVault = async (item: VocabularyItem) => {
  // Local logic
  const localVocab = getLocal(LOCAL_KEYS.VOCAB) || [];
  const existingIdx = localVocab.findIndex((v: any) => v.dutch === item.dutch);
  
  let newItem = { ...item };
  if (existingIdx >= 0) {
    const existing = localVocab[existingIdx];
    const newCount = (existing.sync_count || 0) + 1;
    let newMastery = existing.mastery;
    if (newCount > 5) newMastery = VocabMastery.MASTERED;
    else if (newCount > 2) newMastery = VocabMastery.LEARNING;
    
    newItem = { ...existing, sync_count: newCount, mastery: newMastery, last_practiced: new Date().toISOString() };
    localVocab[existingIdx] = newItem;
  } else {
    newItem = { ...item, mastery: VocabMastery.NEW, sync_count: 1, last_practiced: new Date().toISOString() };
    localVocab.push(newItem);
  }
  
  saveLocal(LOCAL_KEYS.VOCAB, localVocab);
  
  // Cloud logic (Background)
  if (existingIdx >= 0) {
    await silentFetch(supabase.from('user_vocabulary').update(newItem).eq('user_id', DEV_USER_ID).eq('dutch', item.dutch));
  } else {
    await silentFetch(supabase.from('user_vocabulary').insert({ ...newItem, user_id: DEV_USER_ID }));
  }
};

export const updateVocabMastery = async (id: string, mastery: VocabMastery) => {
  const localVocab = getLocal(LOCAL_KEYS.VOCAB) || [];
  const item = localVocab.find((v: any) => v.id === id || v.dutch === id);
  if (item) {
    item.mastery = mastery;
    item.last_practiced = new Date().toISOString();
    saveLocal(LOCAL_KEYS.VOCAB, localVocab);
  }
  await silentFetch(supabase.from('user_vocabulary').update({ mastery, last_practiced: new Date().toISOString() }).eq('id', id));
};

export const fetchVaultVocab = async () => {
  const cloudData = await silentFetch(supabase.from('user_vocabulary').select('*').eq('user_id', DEV_USER_ID).order('last_practiced', { ascending: false }));
  if (cloudData) {
    saveLocal(LOCAL_KEYS.VOCAB, cloudData);
    return cloudData;
  }
  return getLocal(LOCAL_KEYS.VOCAB) || [];
};

// --- CACHÉ DE CONTENIDO ---
export const getCachedContent = async (chapterId: string) => {
  return await silentFetch(supabase.from('content_cache').select('*').eq('chapter_id', chapterId).maybeSingle());
};

export const saveContentToCache = async (chapterId: string, topic: string, content: string, vocabulary?: any, quiz?: any) => {
  await silentFetch(supabase.from('content_cache').upsert({
    chapter_id: chapterId,
    topic,
    content,
    vocabulary,
    quiz,
    created_at: new Date().toISOString()
  }));
};

// --- PROGRESO ---
export const syncProgressToCloud = async (chapterIds: string[]) => {
  saveLocal(LOCAL_KEYS.PROGRESS, chapterIds);
  const records = chapterIds.map(id => ({ user_id: DEV_USER_ID, chapter_id: id, score: 100, completed_at: new Date().toISOString() }));
  await silentFetch(supabase.from('user_progress').upsert(records, { onConflict: 'user_id,chapter_id' }));
};

export const fetchProgressFromCloud = async (): Promise<string[]> => {
  const cloudData = await silentFetch(supabase.from('user_progress').select('chapter_id').eq('user_id', DEV_USER_ID));
  if (cloudData) {
    const ids = cloudData.map((item: any) => item.chapter_id);
    saveLocal(LOCAL_KEYS.PROGRESS, ids);
    return ids;
  }
  return getLocal(LOCAL_KEYS.PROGRESS) || [];
};

export const fetchAllProgress = async () => {
  const cloudData = await silentFetch(supabase.from('user_progress').select('chapter_id, score').eq('user_id', DEV_USER_ID));
  return cloudData || [];
};

export const calculateStreak = async () => {
  const hist = getLocal(LOCAL_KEYS.HISTORY) || [];
  if (hist.length === 0) return 0;
  // Fix: explicitly type dates as string[] to avoid 'unknown' type in spread from Set
  const dates: string[] = Array.from(new Set(hist.map((h: any) => new Date(h.timestamp).toDateString())));
  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  // Fix: explicitly cast to string to satisfy Date constructor overload
  let current = new Date(dates[0] as string);
  streak = 1;
  for (let i = 1; i < dates.length; i++) {
    // Fix: explicitly cast to string to satisfy Date constructor overload
    const prev = new Date(dates[i] as string);
    const diff = (current.getTime() - prev.getTime()) / (1000 * 3600 * 24);
    if (diff <= 1.1) { streak++; current = prev; } else break;
  }
  return streak;
};

export const saveAtelierLog = async (original: string, improved: string, feedback: string, category: string) => {
  await silentFetch(supabase.from('atelier_logs').insert({ user_id: DEV_USER_ID, original_text: original, improved_text: improved, feedback, category }));
};

export const saveChapterProgress = async (id: string, score: number) => {
  const progress = getLocal(LOCAL_KEYS.PROGRESS) || [];
  if (!progress.includes(id)) {
    saveLocal(LOCAL_KEYS.PROGRESS, [...progress, id]);
  }
  await syncProgressToCloud([id]);
};
