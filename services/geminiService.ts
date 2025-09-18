import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChordData } from '../types';

export const generateProgression = async (prompt: string, key: string): Promise<string[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const fullPrompt = `You are a helpful music assistant. A musician has requested a chord progression based on this description: "${prompt}".
The progression should be in the key of ${key}.

If the description is a specific song title, provide the main chord progression for that song as accurately as possible, ensuring it has a reasonable length for a musical section.
If the description is a general style or mood, create a suitable and inspiring chord progression of at least 8 chords.

Return ONLY a comma-separated list of standard chord names.
For example: Am7, G, Fmaj7, C, Am7, G, Fmaj7, C
Do not include any other text, explanation, or markdown formatting.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });
    
    // Aligned with guidelines to directly access and then trim the response text.
    const text = response.text;
    if (!text) {
      return [];
    }
    
    // Clean up response: remove potential markdown and split
    const chords = text.trim().replace(/`/g, '').split(',').map(chord => chord.trim()).filter(Boolean);
    return chords;

  } catch (error) {
    console.error("Error generating progression:", error);
    throw new Error("Failed to generate chord progression from AI.");
  }
};


export const chordData: ChordData = {
    "70's Funk & Soul": [
        { name: "C♯min7, G♯min7, F♯min7, F♯min7, G♯min7, C♯min7, G♯min7, F♯min7, G♯min7", chords: ["C♯min7", "G♯min7", "F♯min7", "F♯min7", "G♯min7", "C♯min7", "G♯min7", "F♯min7", "G♯min7"] },
        { name: "Amaj / D♭, Amaj, Fmaj(♭5)♯9, Fdim / G♯, D♭maj, G♭maj / D♭, G♭maj, D♭maj", chords: ["Amaj / D♭", "Amaj", "Fmaj(♭5)♯9", "Fdim / G♯", "D♭maj", "G♭maj / D♭", "G♭maj", "D♭maj"] },
        { name: "D♭6(sus4), G♭maj add11, G♭maj / B♭, G♭maj add13, A♭min add11, E♭min add11, A♭min / C♭, G♭maj", chords: ["D♭6(sus4)", "G♭maj add11", "G♭maj / B♭", "G♭maj add13", "A♭min add11", "E♭min add11", "A♭min / C♭", "G♭maj"] },
        { name: "Emaj / G♯, Bmaj / F♯, Bmaj / D♯, Emaj, Bmaj / D♯, Bmaj, C♯min, Emaj add13 / B, Amaj, Emaj / G♯, F♯min7, Bmaj / D♯", chords: ["Emaj / G♯", "Bmaj / F♯", "Bmaj / D♯", "Emaj", "Bmaj / D♯", "Bmaj", "C♯min", "Emaj add13 / B", "Amaj", "Emaj / G♯", "F♯min7", "Bmaj / D♯"] },
        { name: "Emin7, Dmaj, B7(sus4), Amin, Emaj7(sus4) / A, Gmaj7 / F♯", chords: ["Emin7", "Dmaj", "B7(sus4)", "Amin", "Emaj7(sus4) / A", "Gmaj7 / F♯"] },
        { name: "A♯maj, Gmin, Gmaj7, Gmin, A♯maj7, Gmin, Gmaj7, Dmaj, Dmin, Gmin", chords: ["A♯maj", "Gmin", "Gmaj7", "Gmin", "A♯maj7", "Gmin", "Gmaj7", "Dmaj", "Dmin", "Gmin"] },
        { name: "Gmaj7, Emin7, Gmaj7, Emin7, Amin7, D7(sus4), D7, Gmaj", chords: ["Gmaj7", "Emin7", "Gmaj7", "Emin7", "Amin7", "D7(sus4)", "D7", "Gmaj"] },
        { name: "Bmaj, Emaj, G♯min, D♯maj, C♯min, F♯7(♭9) / G, Bsus4, Bmaj", chords: ["Bmaj", "Emaj", "G♯min", "D♯maj", "C♯min", "F♯7(♭9) / G", "Bsus4", "Bmaj"] }
    ],
    "80's": [
        { name: "G♭maj, D♭maj / F, E♭sus2 / F, Adim♯5, B♭min7, C♭6(sus2) / A♭, C♭sus2(♭5) / D♭, G♭maj add9, D♭maj / F, D♭sus2(♭5) / E♭, A♭9(sus4), D♭maj", chords: ["G♭maj", "D♭maj / F", "E♭sus2 / F", "Adim♯5", "B♭min7", "C♭6(sus2) / A♭", "C♭sus2(♭5) / D♭", "G♭maj add9", "D♭maj / F", "D♭sus2(♭5) / E♭", "A♭9(sus4)", "D♭maj"] },
        { name: "E♭min, G♭maj, D♭maj, C♭maj, E♭min, E♭sus2, G♭maj add9, C♭maj", chords: ["E♭min", "G♭maj", "D♭maj", "C♭maj", "E♭min", "E♭sus2", "G♭maj add9", "C♭maj"] },
        { name: "Dmaj, D6(sus2♭5), Amaj / C♯, F♯min7, Esus4, F♯min7, Emaj / G♯, Dmaj add9", chords: ["Dmaj", "D6(sus2♭5)", "Amaj / C♯", "F♯min7", "Esus4", "F♯min7", "Emaj / G♯", "Dmaj add9"] },
        { name: "C5, Amin7, Fsus2, C5 / G, Cmaj, Csus2, Amin7, Fsus2", chords: ["C5", "Amin7", "Fsus2", "C5 / G", "Cmaj", "Csus2", "Amin7", "Fsus2"] },
        { name: "E♭maj, Dmin, Gmin7, Fmaj / A, Cmin7, B♭maj, Fmaj / A, Fmaj add9 / G", chords: ["E♭maj", "Dmin", "Gmin7", "Fmaj / A", "Cmin7", "B♭maj", "Fmaj / A", "Fmaj add9 / G"] },
        { name: "G♭maj / B♭, A♭min7, G♭maj, G♭6(sus4) / D♭, G♭maj, E♭min, D♭maj, A♭min, E♭min", chords: ["G♭maj / B♭", "A♭min7", "G♭maj", "G♭6(sus4) / D♭", "G♭maj", "E♭min", "D♭maj", "A♭min", "E♭min"] },
        { name: "Fmaj, Gmin7, Fmaj add9 / A, Fmaj7(sus4) / B♭, B♭maj, Fmaj add9 / A, Fmaj7(sus4) / B♭, B♭maj add9", chords: ["Fmaj", "Gmin7", "Fmaj add9 / A", "Fmaj7(sus4) / B♭", "B♭maj", "Fmaj add9 / A", "Fmaj7(sus4) / B♭", "B♭maj add9"] },
        { name: "C♯sus2, C♯min add9, Asus2, Amaj add9, Esus2, Emaj add9, Bmaj add9, Bmaj add11", chords: ["C♯sus2", "C♯min add9", "Asus2", "Amaj add9", "Esus2", "Emaj add9", "Bmaj add9", "Bmaj add11"] },
        { name: "F♯min7, C♯min7, Bmaj add11, Amaj, F♯min7, Emaj add9, G♯min7, Amaj7", chords: ["F♯min7", "C♯min7", "Bmaj add11", "Amaj", "F♯min7", "Emaj add9", "G♯min7", "Amaj7"] },
        { name: "D5, Bmin7, Gmaj add9, Asus4, D5, Bmin7, Gmaj add9, Asus4", chords: ["D5", "Bmin7", "Gmaj add9", "Asus4", "D5", "Bmin7", "Gmaj add9", "Asus4"] }
    ],
    "Alternative": [
        { name: "Amin, Fmaj♯11, Gmaj add9, Emin add9, Amin7, Fmaj♯11, Emin, Amin / E", chords: ["Amin", "Fmaj♯11", "Gmaj add9", "Emin add9", "Amin7", "Fmaj♯11", "Emin", "Amin / E"] },
        { name: "Emaj, Emaj / G♯, Amaj9, Bmaj add9, Cmaj add9, Bmin add9, Cmaj7(no3), Amin9", chords: ["Emaj", "Emaj / G♯", "Amaj9", "Bmaj add9", "Cmaj add9", "Bmin add9", "Cmaj7(no3)", "Amin9"] },
        { name: "Fmaj7, Emin7, Emin / G, Fmaj / A, Gmaj / B, Amin(no5), Dmin7, Cmaj(no5), Gmaj", chords: ["Fmaj7", "Emin7", "Emin / G", "Fmaj / A", "Gmaj / B", "Amin(no5)", "Dmin7", "Cmaj(no5)", "Gmaj"] }
    ],
    "Blues": [
        { name: "C9, Edim♯5, F9, D7, C7, G9, F9, Cmaj", chords: ["C9", "Edim♯5", "F9", "D7", "C7", "G9", "F9", "Cmaj"] },
        { name: "B♭sus2(♭5) / C, F7, Fmin7(♭5), Gmin7, E7, A7, Fmaj add13 / A, G7, Csus4", chords: ["B♭sus2(♭5) / C", "F7", "Fmin7(♭5)", "Gmin7", "E7", "A7", "Fmaj add13 / A", "G7", "Csus4"] },
        { name: "Bmaj7, A♯min7(♭5), D♯7, G♯min7, C♯7, F♯7, B7, E7, A7, D♯min7, G♯7, Dmin7, G7, C♯min7, Bmaj", chords: ["Bmaj7", "A♯min7(♭5)", "D♯7", "G♯min7", "C♯7", "F♯7", "B7", "E7", "A7", "D♯min7", "G♯7", "Dmin7", "G7", "C♯min7", "Bmaj"] },
        { name: "E7(sus4), E7, Edim7, F♯min7(♭5) / E, Emaj", chords: ["E7(sus4)", "E7", "Edim7", "F♯min7(♭5) / E", "Emaj"] },
        { name: "Cmaj / G, G7, F7, G7, F7, Cmaj / G, G7, Cmaj / G", chords: ["Cmaj / G", "G7", "F7", "G7", "F7", "Cmaj / G", "G7", "Cmaj / G"] },
        { name: "F7, F7, D7, D7, Gmin7, Gmin7, C7, C7, Fmaj", chords: ["F7", "F7", "D7", "D7", "Gmin7", "Gmin7", "C7", "C7", "Fmaj"] },
        { name: "B♭7, B♭7, E♭7, E♭7, B♭7, B♭7, F7, E♭7, B♭7, B♭7", chords: ["B♭7", "B♭7", "E♭7", "E♭7", "B♭7", "B♭7", "F7", "E♭7", "B♭7", "B♭7"] },
        { name: "B♭sus2(♭5) / C, F7, Fmin7(♭5), Gmin7, E7, A7, Fmaj add13 / A, G7, Csus4", chords: ["B♭sus2(♭5) / C", "F7", "Fmin7(♭5)", "Gmin7", "E7", "A7", "Fmaj add13 / A", "G7", "Csus4"] },
        { name: "A♭maj add13, A♭7, A♭maj add13, A♭maj add13, D♭maj add13, D♭7, D♭maj add13, E♭13, D♭7, A♭7", chords: ["A♭maj add13", "A♭7", "A♭maj add13", "A♭maj add13", "D♭maj add13", "D♭7", "D♭maj add13", "E♭13", "D♭7", "A♭7"] },
        { name: "Cmaj add13, F9, Cmaj add13, C9, Fmaj add9, F9, Cmaj, A7(♯5), Dmaj add9, G♯9, G9, Cmaj add13, Fmaj, Cmaj add13, G7(♯5)♯9", chords: ["Cmaj add13", "F9", "Cmaj add13", "C9", "Fmaj add9", "F9", "Cmaj", "A7(♯5)", "Dmaj add9", "G♯9", "G9", "Cmaj add13", "Fmaj", "Cmaj add13", "G7(♯5)♯9"] }
    ],
    "Bossa Nova": [
        { name: "A♭maj7, Adim7, B♭min7, Bdim7, Cmin7, E♭maj add13 / B♭, A♭min7, E♭7(♯5)", chords: ["A♭maj7", "Adim7", "B♭min7", "Bdim7", "Cmin7", "E♭maj add13 / B♭", "A♭min7", "E♭7(♯5)"] },
        { name: "Gmaj add13, Amin7, Bmin7, A♯7(♭5), D7(sus4) / A, G♯7, G6(sus2)", chords: ["Gmaj add13", "Amin7", "Bmin7", "A♯7(♭5)", "D7(sus4) / A", "G♯7", "G6(sus2)"] },
        { name: "Emaj9, Bmaj add13, Gmaj add11, D♯min♭9 / E, B7(♯5)♯9 / D♯, B7(♯5)♯9, Emaj9, B7(♯5)♯9 / D♯", chords: ["Emaj9", "Bmaj add13", "Gmaj add11", "D♯min♭9 / E", "B7(♯5)♯9 / D♯", "B7(♯5)♯9", "Emaj9", "B7(♯5)♯9 / D♯"] },
        { name: "Cmaj7, C♯dim7, Dmin7, D♯dim7, Emin, Gmin♭9 / A♯, Amin7, D7♯9, Gmaj7 13", chords: ["Cmaj7", "C♯dim7", "Dmin7", "D♯dim7", "Emin", "Gmin♭9 / A♯", "Amin7", "D7♯9", "Gmaj7 13"] },
        { name: "Gmaj9, Gmaj7, F♯min♭9 / G, F♯maj♭9 / G, Cmaj9 / G, Cmaj7 / G, D7(♯5)♯9 / F♯, Gmaj7", chords: ["Gmaj9", "Gmaj7", "F♯min♭9 / G", "F♯maj♭9 / G", "Cmaj9 / G", "Cmaj7 / G", "D7(♯5)♯9 / F♯", "Gmaj7"] },
        { name: "Emin9, D♯9, Dmin7, C♯9", chords: ["Emin9", "D♯9", "Dmin7", "C♯9"] },
        { name: "Fmaj7, Fmaj7, Emin♭9 / F, Emaj♭9 / F, B♭maj9 / F, B♭maj7 / F, C7(♯5)♯9 / E, E6(sus2♭5), Fmaj7", chords: ["Fmaj7", "Fmaj7", "Emin♭9 / F", "Emaj♭9 / F", "B♭maj9 / F", "B♭maj7 / F", "C7(♯5)♯9 / E", "E6(sus2♭5)", "Fmaj7"] },
        { name: "Emin9, Gsus2(♭5) / A, Dmin7, Emin♭9 / G, D7(sus2) / C", chords: ["Emin9", "Gsus2(♭5) / A", "Dmin7", "Emin♭9 / G", "D7(sus2) / C"] },
        { name: "Asus2(♭5) / B, G♯sus2(♭5) / A♯, F♯♯sus2(♭5) / A, F♯sus2(♭5) / G♯, Emin / F♯♯", chords: ["Asus2(♭5) / B", "G♯sus2(♭5) / A♯", "F♯♯sus2(♭5) / A", "F♯sus2(♭5) / G♯", "Emin / F♯♯"] },
        { name: "Gmaj7, G♯dim7, D7(sus4) / A, G♯7(♭5)", chords: ["Gmaj7", "G♯dim7", "D7(sus4) / A", "G♯7(♭5)"] }
    ],
    "Chill": [
        { name: "Cmin, G♯maj / E♭, Fmaj / C, Gmaj / D, E♭maj, Gmin / D, Fsus4, Fmaj, Cmin", chords: ["Cmin", "G♯maj / E♭", "Fmaj / C", "Gmaj / D", "E♭maj", "Gmin / D", "Fsus4", "Fmaj", "Cmin"] },
        { name: "E♭9(sus4), F♯min11, E♭maj add9 11 / F, Dmaj7(♯5), E♭9(sus4), Emaj11(♯5) / A♭, D♭maj9", chords: ["E♭9(sus4)", "F♯min11", "E♭maj add9 11 / F", "Dmaj7(♯5)", "E♭9(sus4)", "Emaj11(♯5) / A♭", "D♭maj9"] },
        { name: "C♯min9, F♯9(sus4), G♯9(sus4), B7♭9, C♯min9, G♯9(sus4), B7♭9", chords: ["C♯min9", "F♯9(sus4)", "G♯9(sus4)", "B7♭9", "C♯min9", "G♯9(sus4)", "B7♭9"] },
        { name: "G♯min7, Emaj / G♯, Bmaj7, F♯maj add13 / A♯, G♯min7, G♯min, Bmaj7, C♯min7", chords: ["G♯min7", "Emaj / G♯", "Bmaj7", "F♯maj add13 / A♯", "G♯min7", "G♯min", "Bmaj7", "C♯min7"] },
        { name: "F♯min7, Amaj7, Emaj add13, Dmaj add13, Amin7, Amaj7, Emaj add13, Dmaj add13", chords: ["F♯min7", "Amaj7", "Emaj add13", "Dmaj add13", "Amin7", "Amaj7", "Emaj add13", "Dmaj add13"] },
        { name: "Cmaj7, Emin9, Fmaj9♯11, Amin11, A♯maj9♯11, Dmin11, D♯maj9♯11, Gmin9, G♯maj7, Cmin", chords: ["Cmaj7", "Emin9", "Fmaj9♯11", "Amin11", "A♯maj9♯11", "Dmin11", "D♯maj9♯11", "Gmin9", "G♯maj7", "Cmin"] },
        { name: "Cmin7, Bmaj7, B♭min7, A9 13, Emaj7 / A♭", chords: ["Cmin7", "Bmaj7", "B♭min7", "A9 13", "Emaj7 / A♭"] }
    ],
    "Cinematic": [
        { name: "Fmaj7(sus2), Cmaj / E, Csus2 / D, Fmaj add9 / A, D7(sus4) / A, Fmaj7(sus2) / G, Cmaj / G, Cmaj", chords: ["Fmaj7(sus2)", "Cmaj / E", "Csus2 / D", "Fmaj add9 / A", "D7(sus4) / A", "Fmaj7(sus2) / G", "Cmaj / G", "Cmaj"] },
        { name: "E♭maj7, Fmin, Gmin, B♭maj, Dmin, Cmin, Fmaj, Gmin, B♭maj", chords: ["E♭maj7", "Fmin", "Gmin", "B♭maj", "Dmin", "Cmin", "Fmaj", "Gmin", "B♭maj"] },
        { name: "Emaj, F♯min, Emin, Dsus4, Amaj / C♯, Emaj, F♯min, Bmin / D, Cmaj", chords: ["Emaj", "F♯min", "Emin", "Dsus4", "Amaj / C♯", "Emaj", "F♯min", "Bmin / D", "Cmaj"] },
        { name: "Csus2, Cmin, A♭dim, A♭dim, Csus2, Cmin, A♯min, Amin", chords: ["Csus2", "Cmin", "A♭dim", "A♭dim", "Csus2", "Cmin", "A♯min", "Amin"] },
        { name: "E♭min7 13 / G♭, G♭dim♭9 / C, E♭min7 13 / G♭, G♭dim♭9 / C, Cmin7 13 / E♭, E♭min7 13 / G♭, Cdim♭9", chords: ["E♭min7 13 / G♭", "G♭dim♭9 / C", "E♭min7 13 / G♭", "G♭dim♭9 / C", "Cmin7 13 / E♭", "E♭min7 13 / G♭", "Cdim♭9"] },
        { name: "Gmin, Gsus2, G7(no3), G5, Gmin, G7(no3), B♭sus2, B♭min", chords: ["Gmin", "Gsus2", "G7(no3)", "G5", "Gmin", "G7(no3)", "B♭sus2", "B♭min"] },
        { name: "Amin / C, Fmin / C, Amin / C, Cmin, Adim / C, F♯dim / C, Cdim, Fdim / B", chords: ["Amin / C", "Fmin / C", "Amin / C", "Cmin", "Adim / C", "F♯dim / C", "Cdim", "Fdim / B"] },
        { name: "F♯5, Amin, Emin, G♯min / B, Fmin♯11", chords: ["F♯5", "Amin", "Emin", "G♯min / B", "Fmin♯11"] },
        { name: "C6 9, Dmin6 9, Cmaj / E, Fmaj9, Gmaj add11, Amin9, Dmin7, Emin / G", chords: ["C6 9", "Dmin6 9", "Cmaj / E", "Fmaj9", "Gmaj add11", "Amin9", "Dmin7", "Emin / G"] },
        { name: "Amin7, Emin7, Gmaj, D5, Cmaj / E, Cmaj7(no3), Gmaj(no5), Dmaj / F♯", chords: ["Amin7", "Emin7", "Gmaj", "D5", "Cmaj / E", "Cmaj7(no3)", "Gmaj(no5)", "Dmaj / F♯"] },
        { name: "A♭7, B♭maj add11, Amaj, G7(♯5), A♭7, B♭maj add11, Amaj, A♭maj add13", chords: ["A♭7", "B♭maj add11", "Amaj", "G7(♯5)", "A♭7", "B♭maj add11", "Amaj", "A♭maj add13"] },
        { name: "B♭min, G♭maj, Fmin, B♭min, G♭maj, D♭maj, A♭maj, B♭min, G♭maj, E♭min, B♭min, Fmaj, Fmaj", chords: ["B♭min", "G♭maj", "Fmin", "B♭min", "G♭maj", "D♭maj", "A♭maj", "B♭min", "G♭maj", "E♭min", "B♭min", "Fmaj", "Fmaj"] },
        { name: "Cmaj7, G♯maj, Fmaj, Cmaj, Cmaj7, D♯maj, F♯maj, Amaj, Cmaj", chords: ["Cmaj7", "G♯maj", "Fmaj", "Cmaj", "Cmaj7", "D♯maj", "F♯maj", "Amaj", "Cmaj"] },
        { name: "Amin add9, Emin7, Fmaj7, Dmin add9, Fmaj, Amin7, Dmin7, Dmin11", chords: ["Amin add9", "Emin7", "Fmaj7", "Dmin add9", "Fmaj", "Amin7", "Dmin7", "Dmin11"] },
        { name: "Emin, Cmaj / E, Dsus4, Dmaj, Emin, Cmaj, Dsus4, Dmaj", chords: ["Emin", "Cmaj / E", "Dsus4", "Dmaj", "Emin", "Cmaj", "Dsus4", "Dmaj"] },
        { name: "Bmin7(♭5), Dmin7(♭5), Fmin7(♭5), G♯min7(♭5), Bmin7(♭5), Dmin7(♭5), Fmin7(♭5), Bmin7(♭5)", chords: ["Bmin7(♭5)", "Dmin7(♭5)", "Fmin7(♭5)", "G♯min7(♭5)", "Bmin7(♭5)", "Dmin7(♭5)", "Fmin7(♭5)", "Bmin7(♭5)"] },
        { name: "B♭sus2, Gsus2, B♭sus2, C♯sus2, Esus2, Gsus2, B♭sus2, Fsus4 / C", chords: ["B♭sus2", "Gsus2", "B♭sus2", "C♯sus2", "Esus2", "Gsus2", "B♭sus2", "Fsus4 / C"] },
        { name: "Cmin / D♯, D♯min, Cmin, D♯min, C♯min / E, Emin, A♯min, F♯min", chords: ["Cmin / D♯", "D♯min", "Cmin", "D♯min", "C♯min / E", "Emin", "A♯min", "F♯min"] },
        { name: "D♭maj7, D♭min, Amin, Fmin, Eaug, D♭maj7, D♭maj7♯9, Amin / C", chords: ["D♭maj7", "D♭min", "Amin", "Fmin", "Eaug", "D♭maj7", "D♭maj7♯9", "Amin / C"] },
        { name: "Amaj / D♭, Cmaj, D♯maj, F♯maj, Cmaj, F♯maj, Cmaj / E, Amaj / D♭", chords: ["Amaj / D♭", "Cmaj", "D♯maj", "F♯maj", "Cmaj", "F♯maj", "Cmaj / E", "Amaj / D♭"] },
        { name: "Fmin, A♭maj, B♭min add9, B♭min, E♭maj, A♭sus2, D♭maj, D♭maj", chords: ["Fmin", "A♭maj", "B♭min add9", "B♭min", "E♭maj", "A♭sus2", "D♭maj", "D♭maj"] },
        { name: "Amin9, Emin7, Fmaj7, Dmin9, G6(sus2) / E, G9 13, Amin7, Gmaj / B", chords: ["Amin9", "Emin7", "Fmaj7", "Dmin9", "G6(sus2) / E", "G9 13", "Amin7", "Gmaj / B"] }
    ],
    "Classical": [
        { name: "Cmaj, Gmaj / B, Cmaj, Cmaj, Fmaj / C, Emin7 / G, Ddim / G♯, Amin, Emin / G, Gmaj, Fsus2 / G, Fsus2(♭5) / G, Cmaj(no5), C7, Fmaj / C, Dmin / F, Cmaj / G, G7, Cmaj", chords: ["Cmaj", "Gmaj / B", "Cmaj", "Cmaj", "Fmaj / C", "Emin7 / G", "Ddim / G♯", "Amin", "Emin / G", "Gmaj", "Fsus2 / G", "Fsus2(♭5) / G", "Cmaj(no5)", "C7", "Fmaj / C", "Dmin / F", "Cmaj / G", "G7", "Cmaj"] },
        { name: "Emaj, Emaj / G♯, F♯min6 11, B7, Emaj, F♯min6 11, Emaj / G♯, A♯dim♯5, Bmaj", chords: ["Emaj", "Emaj / G♯", "F♯min6 11", "B7", "Emaj", "F♯min6 11", "Emaj / G♯", "A♯dim♯5", "Bmaj"] },
        { name: "Fmin, Fmin♯11, Fmin, Fmin add9, Cmin, Fmin, B♭min, B♭min add13, Fmin", chords: ["Fmin", "Fmin♯11", "Fmin", "Fmin add9", "Cmin", "Fmin", "B♭min", "B♭min add13", "Fmin"] },
        { name: "D♭9, A♭min, B♭min7(♭5), E♭maj, D♭min / E, A♭min / E♭, D♭9, G♭maj7 / B♭, C♭9, Emaj add13 / C♭, C♭maj7 / B♭, A♭min, D♭maj", chords: ["D♭9", "A♭min", "B♭min7(♭5)", "E♭maj", "D♭min / E", "A♭min / E♭", "D♭9", "G♭maj7 / B♭", "C♭9", "Emaj add13 / C♭", "C♭maj7 / B♭", "A♭min", "D♭maj"] },
        { name: "Emaj(no5), Bmaj, Amin, Emaj, Emaj, C♯min, Emaj / G♯, B7, Emaj, C♯min(no5) / E, Emaj7(no3), Amaj / E, Emaj, F♯min7 / E, Emaj, F♯min7 / E, Emaj", chords: ["Emaj(no5)", "Bmaj", "Amin", "Emaj", "Emaj", "C♯min", "Emaj / G♯", "B7", "Emaj", "C♯min(no5) / E", "Emaj7(no3)", "Amaj / E", "Emaj", "F♯min7 / E", "Emaj", "F♯min7 / E", "Emaj"] },
        { name: "Amaj / C♯, Dmin, Cmaj / E, Fmaj(no5), Bdim / D, Cmaj / E, Gmaj / B, Cmaj, Fmaj(no5), Cmaj / G, Gmaj, Coctave", chords: ["Amaj / C♯", "Dmin", "Cmaj / E", "Fmaj(no5)", "Bdim / D", "Cmaj / E", "Gmaj / B", "Cmaj", "Fmaj(no5)", "Cmaj / G", "Gmaj", "Coctave"] },
        { name: "Fmaj, Fmaj / A, Fmaj / C, Gmin / D, Dmin, B♭maj7, G7(no3), B♭5, Fmaj / C, Cmaj, Fmaj(no5), Amin(no5), Amin(no5) / C, Csus2 / D, Dmin, Gmin / B♭, Fmaj / A, Fmaj / C, Cmaj, Fmaj", chords: ["Fmaj", "Fmaj / A", "Fmaj / C", "Gmin / D", "Dmin", "B♭maj7", "G7(no3)", "B♭5", "Fmaj / C", "Cmaj", "Fmaj(no5)", "Amin(no5)", "Amin(no5) / C", "Csus2 / D", "Dmin", "Gmin / B♭", "Fmaj / A", "Fmaj / C", "Cmaj", "Fmaj"] },
        { name: "Amin, Amaj9(sus4), Amin, Cmaj(no5) / E, Fmaj add13, Gmaj, Cmaj7 / E, Fmaj, Bdim / D, Amin / E, E7", chords: ["Amin", "Amaj9(sus4)", "Amin", "Cmaj(no5) / E", "Fmaj add13", "Gmaj", "Cmaj7 / E", "Fmaj", "Bdim / D", "Amin / E", "E7"] },
        { name: "Emin, Bmaj, Emin, Emin7, Amin, Bmaj, E7, Amaj, Dmaj, Gmaj, Cmaj, F♯min7(♭5), Bmaj, Emin", chords: ["Emin", "Bmaj", "Emin", "Emin7", "Amin", "Bmaj", "E7", "Amaj", "Dmaj", "Gmaj", "Cmaj", "F♯min7(♭5)", "Bmaj", "Emin"] },
        { name: "Gmin, Cmin, Fmaj / C, B♭maj, Edim / B♭, Amaj, Dmin / F, Edim, Dmin, Edim", chords: ["Gmin", "Cmin", "Fmaj / C", "B♭maj", "Edim / B♭", "Amaj", "Dmin / F", "Edim", "Dmin", "Edim"] },
        { name: "Dmaj, Bdim / D, E♭min7(♭5), Asus2(♭5) / B, Emaj add13, Fdim♯5, Fmin6 11, C♯6♯9 / F, G♭6(sus2) / E♭, A♭maj / E♭, C♯6(sus4), Fmin♭9 / C, Fmin7 / C, B7(♭5), B♭7", chords: ["Dmaj", "Bdim / D", "E♭min7(♭5)", "Asus2(♭5) / B", "Emaj add13", "Fdim♯5", "Fmin6 11", "C♯6♯9 / F", "G♭6(sus2) / E♭", "A♭maj / E♭", "C♯6(sus4)", "Fmin♭9 / C", "Fmin7 / C", "B7(♭5)", "B♭7"] },
        { name: "G♭maj, C♭maj, G♭maj, D♭maj, G♭6(sus2) / D♭, D♭maj, D♭7, G♭maj, C♭maj, G♭maj / B♭, E♭min, D♭7(sus4), D♭7, G♭maj", chords: ["G♭maj", "C♭maj", "G♭maj", "D♭maj", "G♭6(sus2) / D♭", "D♭maj", "D♭7", "G♭maj", "C♭maj", "G♭maj / B♭", "E♭min", "D♭7(sus4)", "D♭7", "G♭maj"] },
        { name: "Gmin, Fmaj / A, Gmin, Fmaj, Dmin, Fmaj, B♭maj, Gmin, Cmaj, Cmaj / E, Fmaj", chords: ["Gmin", "Fmaj / A", "Gmin", "Fmaj", "Dmin", "Fmaj", "B♭maj", "Gmin", "Cmaj", "Cmaj / E", "Fmaj"] },
        { name: "D♭dim, D♭min7, D♭6(sus2♭5), Amin6 11, A♭7, D♭dim, D♭min7, D♭6(sus2♭5), Amin6 11, A♭7, D♭dim, D♭min7, F♯min / D♭, F♯min7(♭5) / C, C♭7, F♭maj", chords: ["D♭dim", "D♭min7", "D♭6(sus2♭5)", "Amin6 11", "A♭7", "D♭dim", "D♭min7", "D♭6(sus2♭5)", "Amin6 11", "A♭7", "D♭dim", "D♭min7", "F♯min / D♭", "F♯min7(♭5) / C", "C♭7", "F♭maj"] },
        { name: "Dmaj, Emin / B, Emin, Amaj, F♯min, Bmin, Emin7, F♯min, Emin / G, G♯min7(♭5), A7, Emin add13, Dmaj / F♯, Amaj", chords: ["Dmaj", "Emin / B", "Emin", "Amaj", "F♯min", "Bmin", "Emin7", "F♯min", "Emin / G", "G♯min7(♭5)", "A7", "Emin add13", "Dmaj / F♯", "Amaj"] },
        { name: "Gmin, Dmaj, Gmin, Cmin, E♭maj add13, Gmin, Dmaj, D7, Gmin / D, Dmaj, D7, Gmin / D, Dmaj", chords: ["Gmin", "Dmaj", "Gmin", "Cmin", "E♭maj add13", "Gmin", "Dmaj", "D7", "Gmin / D", "Dmaj", "D7", "Gmin / D", "Dmaj"] }
    ],
    "Common Progressions": [
        { name: "Cmaj, Dmin, Emin, Fmaj, Gmaj", chords: ["Cmaj", "Dmin", "Emin", "Fmaj", "Gmaj"] },
        { name: "Cmaj add11, Dmin add11, Emin7, Fmaj7, G7", chords: ["Cmaj add11", "Dmin add11", "Emin7", "Fmaj7", "G7"] },
        { name: "Cmaj7, Dmin7, E7(no3), Fmaj, Gmaj add13", chords: ["Cmaj7", "Dmin7", "E7(no3)", "Fmaj", "Gmaj add13"] },
        { name: "Cmaj, Emin7, Amin, Fmaj", chords: ["Cmaj", "Emin7", "Amin", "Fmaj"] },
        { name: "Cmaj7, Emin7, Amin add11, Fmaj7", chords: ["Cmaj7", "Emin7", "Amin add11", "Fmaj7"] },
        { name: "Cmaj, Emin7, Amin, Fmaj add9", chords: ["Cmaj", "Emin7", "Amin", "Fmaj add9"] },
        { name: "Cmaj, Fmaj, Cmaj, Gmaj", chords: ["Cmaj", "Fmaj", "Cmaj", "Gmaj"] },
        { name: "Cmaj, Fmaj, Cmaj add9, Gmaj add9", chords: ["Cmaj", "Fmaj", "Cmaj add9", "Gmaj add9"] },
        { name: "Cmaj add9, Fmaj, Cmaj7, Gmaj", chords: ["Cmaj add9", "Fmaj", "Cmaj7", "Gmaj"] },
        { name: "Cmaj, Fmaj13, Cmaj7, Gmaj add9", chords: ["Cmaj", "Fmaj13", "Cmaj7", "Gmaj add9"] },
        { name: "Cmaj, Fmaj, Dmin, Gmaj", chords: ["Cmaj", "Fmaj", "Dmin", "Gmaj"] },
        { name: "Cmaj7, Fmaj7(♭5), Dmin7, Gmaj add9", chords: ["Cmaj7", "Fmaj7(♭5)", "Dmin7", "Gmaj add9"] },
        { name: "Cmaj add9, Fmaj9, Dmin6 11, G7", chords: ["Cmaj add9", "Fmaj9", "Dmin6 11", "G7"] },
        { name: "Cmaj7, Fmaj7, Dmin7, G7", chords: ["Cmaj7", "Fmaj7", "Dmin7", "G7"] },
        { name: "Cmaj, Fmaj, Gmaj, Cmaj", chords: ["Cmaj", "Fmaj", "Gmaj", "Cmaj"] },
        { name: "Csus2, Fmaj, Gmaj add11, Cmaj add9", chords: ["Csus2", "Fmaj", "Gmaj add11", "Cmaj add9"] },
        { name: "Cmaj add9, Fmaj add9, Gmaj add9, Cmaj add9", chords: ["Cmaj add9", "Fmaj add9", "Gmaj add9", "Cmaj add9"] },
        { name: "Cmaj add9, Fmaj7, Gmaj add11, Cmaj add9", chords: ["Cmaj add9", "Fmaj7", "Gmaj add11", "Cmaj add9"] },
        { name: "Cmaj, Fmaj, Gmaj, Fmaj", chords: ["Cmaj", "Fmaj", "Gmaj", "Fmaj"] },
        { name: "Cmaj add11, Fmaj add13, G7, Fmaj7", chords: ["Cmaj add11", "Fmaj add13", "G7", "Fmaj7"] },
        { name: "Cmaj, Fmaj add13, Gmaj add9, Fmaj7", chords: ["Cmaj", "Fmaj add13", "Gmaj add9", "Fmaj7"] },
        { name: "Cmaj7, Fmaj add13, Gmaj add9, Fmaj", chords: ["Cmaj7", "Fmaj add13", "Gmaj add9", "Fmaj"] },
        { name: "Cmaj, Fmaj, Amin, Gmaj", chords: ["Cmaj", "Fmaj", "Amin", "Gmaj"] },
        { name: "Cmaj, Fmaj7, Amin7, Gsus4", chords: ["Cmaj", "Fmaj7", "Amin7", "Gsus4"] },
        { name: "Cmaj7, Fmaj add13, Amin, Gmaj", chords: ["Cmaj7", "Fmaj add13", "Amin", "Gmaj"] },
        { name: "Amin, Emaj, Amin, Dmin", chords: ["Amin", "Emaj", "Amin", "Dmin"] },
        { name: "Amin, Emaj, Amin, Dmin / F", chords: ["Amin", "Emaj", "Amin", "Dmin / F"] },
        { name: "Amin, Emaj, Amin, Dmin♯11", chords: ["Amin", "Emaj", "Amin", "Dmin♯11"] },
        { name: "Amin, Emaj, Amin, Ddim7", chords: ["Amin", "Emaj", "Amin", "Ddim7"] },
        { name: "Amin, E7, Asus4, Dmin9", chords: ["Amin", "E7", "Asus4", "Dmin9"] },
        { name: "Cmaj, Gmaj, Amin, Fmaj", chords: ["Cmaj", "Gmaj", "Amin", "Fmaj"] },
        { name: "Csus2, Gmaj add9, Amin, Fsus2", chords: ["Csus2", "Gmaj add9", "Amin", "Fsus2"] },
        { name: "C5, Gmaj add11 / B, Amin11, Fmaj add9 / A", chords: ["C5", "Gmaj add11 / B", "Amin11", "Fmaj add9 / A"] },
        { name: "Cmaj add9, Gmaj, Amin add11, Fmaj13", chords: ["Cmaj add9", "Gmaj", "Amin add11", "Fmaj13"] },
        { name: "Amin, Fmaj, Cmaj, Gmaj", chords: ["Amin", "Fmaj", "Cmaj", "Gmaj"] },
        { name: "Amin7, Fmaj add9, Cmaj, Gmaj add9", chords: ["Amin7", "Fmaj add9", "Cmaj", "Gmaj add9"] },
        { name: "Amin7, Fsus2, Cmaj, Gmaj add11", chords: ["Amin7", "Fsus2", "Cmaj", "Gmaj add11"] },
        { name: "Amin7, Fmaj, Cmaj add9, Gmaj add11", chords: ["Amin7", "Fmaj", "Cmaj add9", "Gmaj add11"] },
        { name: "Cmaj, Amin, Fmaj, Gmaj", chords: ["Cmaj", "Amin", "Fmaj", "Gmaj"] },
        { name: "Csus2, Amin add9, Fmaj add9, Gmaj add11", chords: ["Csus2", "Amin add9", "Fmaj add9", "Gmaj add11"] },
        { name: "Csus2, Amin7, Fmaj, Gsus4", chords: ["Csus2", "Amin7", "Fmaj", "Gsus4"] },
        { name: "Cmaj add9, Amin7, F6(sus2), Gmaj add11", chords: ["Cmaj add9", "Amin7", "F6(sus2)", "Gmaj add11"] },
        { name: "Cmaj, B♭maj, Cmaj", chords: ["Cmaj", "B♭maj", "Cmaj"] },
        { name: "Cmaj, B♭maj add9, Cmaj add9", chords: ["Cmaj", "B♭maj add9", "Cmaj add9"] },
        { name: "Cmaj add11, B♭maj♯11, Cmaj add9", chords: ["Cmaj add11", "B♭maj♯11", "Cmaj add9"] },
        { name: "Csus4, B♭maj7(sus2), Csus2", chords: ["Csus4", "B♭maj7(sus2)", "Csus2"] },
        { name: "Csus2 / D, Gmaj, Cmaj, Amin", chords: ["Csus2 / D", "Gmaj", "Cmaj", "Amin"] },
        { name: "Dmin, Gmaj, Cmaj, Amin", chords: ["Dmin", "Gmaj", "Cmaj", "Amin"] },
        { name: "Dmin7, Gmaj, Cmaj add9, Amin7", chords: ["Dmin7", "Gmaj", "Cmaj add9", "Amin7"] },
        { name: "Dmin11, Gmaj add9, Cmaj add9, Amin7", chords: ["Dmin11", "Gmaj add9", "Cmaj add9", "Amin7"] },
        { name: "Dmin11, Gsus2, Cmaj add9, Amin7", chords: ["Dmin11", "Gsus2", "Cmaj add9", "Amin7"] },
        { name: "Dmin7, G7, Cmaj7", chords: ["Dmin7", "G7", "Cmaj7"] },
        { name: "Dmin add11, G9, Cmaj7", chords: ["Dmin add11", "G9", "Cmaj7"] },
        { name: "Dmin7, Gmaj, Cmaj7", chords: ["Dmin7", "Gmaj", "Cmaj7"] },
        { name: "Dmin7, Gmin7, Cmaj7", chords: ["Dmin7", "Gmin7", "Cmaj7"] },
        { name: "Amin9, Fmaj add9, Cmaj7, Gmaj add9", chords: ["Amin9", "Fmaj add9", "Cmaj7", "Gmaj add9"] },
        { name: "Amin add9, Fmaj add9, Cmaj, Gmaj add13", chords: ["Amin add9", "Fmaj add9", "Cmaj", "Gmaj add13"] },
        { name: "Amin7, Fmaj7, Cmaj add9, Gmaj(no5)", chords: ["Amin7", "Fmaj7", "Cmaj add9", "Gmaj(no5)"] },
        { name: "Amin, Gmaj, Fmaj, Gmaj", chords: ["Amin", "Gmaj", "Fmaj", "Gmaj"] },
        { name: "Amin7, Gmaj add9, Fmaj7, Gmaj add9", chords: ["Amin7", "Gmaj add9", "Fmaj7", "Gmaj add9"] },
        { name: "Amin, Gmaj add9, Fmaj7, Gmaj add9", chords: ["Amin", "Gmaj add9", "Fmaj7", "Gmaj add9"] }
    ],
    "Contemporary R&B": [
        { name: "Emaj7, D♯7, G♯min, F♯min, Bmaj, Emaj7, D♯7, G♯min, F♯min7, Bmaj", chords: ["Emaj7", "D♯7", "G♯min", "F♯min", "Bmaj", "Emaj7", "D♯7", "G♯min", "F♯min7", "Bmaj"] },
        { name: "Dmaj9, C♯7, F♯min9, Emin9, Amaj7, Dmaj9, C♯7, F♯min9, Emin9, Amaj7", chords: ["Dmaj9", "C♯7", "F♯min9", "Emin9", "Amaj7", "Dmaj9", "C♯7", "F♯min9", "Emin9", "Amaj7"] },
        { name: "Amin, Fmaj7, Emin7, Amin7, Amin, Fmaj7, Emin7, Amin7", chords: ["Amin", "Fmaj7", "Emin7", "Amin7", "Amin", "Fmaj7", "Emin7", "Amin7"] },
        { name: "Fmaj, Gmaj, Emin, Amin, Fmaj, Gmaj, Emin, Amin", chords: ["Fmaj", "Gmaj", "Emin", "Amin", "Fmaj", "Gmaj", "Emin", "Amin"] },
        { name: "Cmin9, E♭maj add9 / F, B♭maj9, Gdim7, Cmin9, E♭maj add9 / F, B♭maj9, Gdim7", chords: ["Cmin9", "E♭maj add9 / F", "B♭maj9", "Gdim7", "Cmin9", "E♭maj add9 / F", "B♭maj9", "Gdim7"] },
        { name: "A♭maj7, G7, F6(sus4) / C, B♭min, E♭7(sus2), A♭maj7, G7, F6(sus4) / C, B♭min, E♭7(sus2)", chords: ["A♭maj7", "G7", "F6(sus4) / C", "B♭min", "E♭7(sus2)", "A♭maj7", "G7", "F6(sus4) / C", "B♭min", "E♭7(sus2)"] },
        { name: "E♭min9, Fmin7, E♭min7, Fmin7, E♭min9, Fmin7, E♭min7, A♭7", chords: ["E♭min9", "Fmin7", "E♭min7", "Fmin7", "E♭min9", "Fmin7", "E♭min7", "A♭7"] },
        { name: "Fmaj, Cmaj add9 / D, B♭maj, B♭min / C♯, Fmaj, Cmaj add9 / D, B♭maj, B♭min / C♯", chords: ["Fmaj", "Cmaj add9 / D", "B♭maj", "B♭min / C♯", "Fmaj", "Cmaj add9 / D", "B♭maj", "B♭min / C♯"] },
        { name: "Amin7, Dmaj9, Amin7, Dmaj9, Amin7, Dmaj9, Amin7, Dmaj9", chords: ["Amin7", "Dmaj9", "Amin7", "Dmaj9", "Amin7", "Dmaj9", "Amin7", "Dmaj9"] },
        { name: "B♭9(sus4), A♭maj / C, D♭maj, G♭maj9, E♭6(sus4) / C, Cmin7(♭5), Faug, B♭9(sus4)", chords: ["B♭9(sus4)", "A♭maj / C", "D♭maj", "G♭maj9", "E♭6(sus4) / C", "Cmin7(♭5)", "Faug", "B♭9(sus4)"] },
        { name: "Amaj9, F♯min9, C♯min9, Amaj9, F♯min9, F♯6(sus4) / C♯, Bsus2(♭5) / C♯", chords: ["Amaj9", "F♯min9", "C♯min9", "Amaj9", "F♯min9", "F♯6(sus4) / C♯", "Bsus2(♭5) / C♯"] }
    ],
    "Deep House": [
        { name: "G♯min7, F♯min7, G♯min7, G♯min7 / F♯, G♯min7, F♯min7, Emaj7, F♯min7", chords: ["G♯min7", "F♯min7", "G♯min7", "G♯min7 / F♯", "G♯min7", "F♯min7", "Emaj7", "F♯min7"] },
        { name: "B♭min9, G♭min9, E♭min9, B♭7(sus2), G♭maj / D♭, Emaj9 / B, Amaj9, G♭6(sus4)", chords: ["B♭min9", "G♭min9", "E♭min9", "B♭7(sus2)", "G♭maj / D♭", "Emaj9 / B", "Amaj9", "G♭6(sus4)"] },
        { name: "Cmin9, Gmin9, E♭min9, Cmin9, Gmin9, E♭min9", chords: ["Cmin9", "Gmin9", "E♭min9", "Cmin9", "Gmin9", "E♭min9"] },
        { name: "Dmaj7 / F♯, Emaj7 / G♯, Fmaj7 / A, Gmaj7 / B, Dmaj7 / F♯, Amaj7 / C♯, Emaj7 / G♯, Dmaj add9 / E", chords: ["Dmaj7 / F♯", "Emaj7 / G♯", "Fmaj7 / A", "Gmaj7 / B", "Dmaj7 / F♯", "Amaj7 / C♯", "Emaj7 / G♯", "Dmaj add9 / E"] },
        { name: "Amin7, Gmaj, C5, Fmaj add9", chords: ["Amin7", "Gmaj", "C5", "Fmaj add9"] },
        { name: "Cmin9, Dmin9, Emin9, E♭min9, Cmin9, Dmin9, Emin9, F♯min9", chords: ["Cmin9", "Dmin9", "Emin9", "E♭min9", "Cmin9", "Dmin9", "Emin9", "F♯min9"] },
        { name: "Bmaj add9, F♯maj, D♯min7, C♯maj add11", chords: ["Bmaj add9", "F♯maj", "D♯min7", "C♯maj add11"] },
        { name: "A♯min9, Amin9, Dmin9, Gmin9, Amin9", chords: ["A♯min9", "Amin9", "Dmin9", "Gmin9", "Amin9"] },
        { name: "F♯min7, F♯6(sus2) / C♯, Dmaj7, B5, F♯min7, F♯6(sus2) / C♯, Dmaj7, B5", chords: ["F♯min7", "F♯6(sus2) / C♯", "Dmaj7", "B5", "F♯min7", "F♯6(sus2) / C♯", "Dmaj7", "B5"] },
        { name: "E♭maj7 / B♭, Cmaj7 / G, B♭maj7 / F, Gmaj7 / D", chords: ["E♭maj7 / B♭", "Cmaj7 / G", "B♭maj7 / F", "Gmaj7 / D"] }
    ],
    "Disco": [
        { name: "Cmin7, Fmin7, A♭maj7, E♭maj7, Cmin7, B♭maj add13, Dmin / F, E♭maj7", chords: ["Cmin7", "Fmin7", "A♭maj7", "E♭maj7", "Cmin7", "B♭maj add13", "Dmin / F", "E♭maj7"] },
        { name: "Dmin7, Cmaj, Gmin, Gmaj, B♭maj7, Cmaj, F6(sus2) / D, Fmaj add13 / A", chords: ["Dmin7", "Cmaj", "Gmin", "Gmaj", "B♭maj7", "Cmaj", "F6(sus2) / D", "Fmaj add13 / A"] },
        { name: "Bmin7, Bmin7 / A, Bmin7, E9(sus4), Gmaj7, Gmaj7 / D, F♯min7, Dmaj7(sus2)", chords: ["Bmin7", "Bmin7 / A", "Bmin7", "E9(sus4)", "Gmaj7", "Gmaj7 / D", "F♯min7", "Dmaj7(sus2)"] },
        { name: "Cmin7, A♭maj7, Gmin7, Gmin7, Cmin7, E♭maj7 / G, Gmin7, B♭maj add13", chords: ["Cmin7", "A♭maj7", "Gmin7", "Gmin7", "Cmin7", "E♭maj7 / G", "Gmin7", "B♭maj add13"] },
        { name: "A♭maj7, D♭maj7, Fmin7, Cmin7, D♭maj7, A♭maj7, B♭min7, E♭maj7, A♭maj7", chords: ["A♭maj7", "D♭maj7", "Fmin7", "Cmin7", "D♭maj7", "A♭maj7", "B♭min7", "E♭maj7", "A♭maj7"] },
        { name: "A♭maj9, Cmin9, A♭maj9, Cmin9, A♭9 13, A♭maj7(♭5) / D, G7(♯5)♯9", chords: ["A♭maj9", "Cmin9", "A♭maj9", "Cmin9", "A♭9 13", "A♭maj7(♭5) / D", "G7(♯5)♯9"] }
    ],
    "Divisi 4 Part": [
        { name: "Amin7, Emin7, Gmaj, Dmaj / F♯, Cmaj / E, Cmaj7(no3), Gmaj(no5), Dmaj / F♯", chords: ["Amin7", "Emin7", "Gmaj", "Dmaj / F♯", "Cmaj / E", "Cmaj7(no3)", "Gmaj(no5)", "Dmaj / F♯"] },
        { name: "Dmaj(no5), A5, Bmin(no5), F♯5, Gmaj(no5), D5, Gmaj(no5), Amaj(no5), Dmaj(no5), Amaj, Bmin(no5), F♯min, Gmaj(no5), Dmaj, Gmaj(no5), Amaj(no5)", chords: ["Dmaj(no5)", "A5", "Bmin(no5)", "F♯5", "Gmaj(no5)", "D5", "Gmaj(no5)", "Amaj(no5)", "Dmaj(no5)", "Amaj", "Bmin(no5)", "F♯min", "Gmaj(no5)", "Dmaj", "Gmaj(no5)", "Amaj(no5)"] },
        { name: "Coctave, C5, Coctave, Cmaj, Fmaj(no5), Fmaj, Ddim / F, Cmaj, Cmaj(no5), Amin(no5), Gmaj, Cmaj(no5)", chords: ["Coctave", "C5", "Coctave", "Cmaj", "Fmaj(no5)", "Fmaj", "Ddim / F", "Cmaj", "Cmaj(no5)", "Amin(no5)", "Gmaj", "Cmaj(no5)"] },
        { name: "B♭min, G♭maj, A♭maj(no5), D♭maj, G♭maj(no5), B♭min7, A♭maj, B♭min, B♭min", chords: ["B♭min", "G♭maj", "A♭maj(no5)", "D♭maj", "G♭maj(no5)", "B♭min7", "A♭maj", "B♭min", "B♭min"] },
        { name: "B♭min, Fmin, E♭min(no5), B♭min, D♭maj, A♭maj, D♭maj / F, G♭maj, D♭maj, A♭7, D♭maj(no5)", chords: ["B♭min", "Fmin", "E♭min(no5)", "B♭min", "D♭maj", "A♭maj", "D♭maj / F", "G♭maj", "D♭maj", "A♭7", "D♭maj(no5)"] },
        { name: "Fmaj, Gmin7, Csus4, Cmaj(no5), B♭sus2(♭5) / E, Fmaj, B♭maj7, Gmin / B♭, B♭6(sus2♭5), Fmaj / A", chords: ["Fmaj", "Gmin7", "Csus4", "Cmaj(no5)", "B♭sus2(♭5) / E", "Fmaj", "B♭maj7", "Gmin / B♭", "B♭6(sus2♭5)", "Fmaj / A"] },
        { name: "Amin, Bmaj(no5), Emin, Fmaj, G7(sus4), Gmaj(no5), Cmaj, Amin, Bmaj(no5), Emin, Fmaj, G7(sus4), Emin / G, G7(no3), Cmaj(no5)", chords: ["Amin", "Bmaj(no5)", "Emin", "Fmaj", "G7(sus4)", "Gmaj(no5)", "Cmaj", "Amin", "Bmaj(no5)", "Emin", "Fmaj", "G7(sus4)", "Emin / G", "G7(no3)", "Cmaj(no5)"] },
        { name: "Goctave, G5, Gtritone, A♭maj7(no3) / G, G5, G5, C♯maj(no5)", chords: ["Goctave", "G5", "Gtritone", "A♭maj7(no3) / G", "G5", "G5", "C♯maj(no5)"] },
        { name: "Dmin(no5), Fmaj(no5), Emin7(♭5), Amaj, Dmin(no5), A7(no3), Dmin, C7(no3), Fmaj(no5), Emaj, Amin(no5), Gmaj, Cmin(no5), B♭sus2(♭5), Fmaj / A", chords: ["Dmin(no5)", "Fmaj(no5)", "Emin7(♭5)", "Amaj", "Dmin(no5)", "A7(no3)", "Dmin", "C7(no3)", "Fmaj(no5)", "Emaj", "Amin(no5)", "Gmaj", "Cmin(no5)", "B♭sus2(♭5)", "Fmaj / A"] },
        { name: "Amin, E7(no3), Fmaj7, Dmin, Fmaj(♭5), Amin7, Dmin7, G7", chords: ["Amin", "E7(no3)", "Fmaj7", "Dmin", "Fmaj(♭5)", "Amin7", "Dmin7", "G7"] }
    ],
    "Drum & Bass": [
        { name: "Bmin9, Emaj13 / B, Dmaj9 / C♯, Amaj9 / C♯, F♯9(sus4) / B, Emaj9 / D♯, Dmaj9, Bmin7", chords: ["Bmin9", "Emaj13 / B", "Dmaj9 / C♯", "Amaj9 / C♯", "F♯9(sus4) / B", "Emaj9 / D♯", "Dmaj9", "Bmin7"] },
        { name: "Cmaj7, Dmaj, Emin, Emin, Cmaj7, Dmaj, Emin, Cmaj", chords: ["Cmaj7", "Dmaj", "Emin", "Emin", "Cmaj7", "Dmaj", "Emin", "Cmaj"] },
        { name: "Amin9 / G, Bmin9 / A, Cmaj9 / B, Gmaj add13 / B, Amin9 / G, Bmin9 / A, Dmaj add9, Cmaj9 / B", chords: ["Amin9 / G", "Bmin9 / A", "Cmaj9 / B", "Gmaj add13 / B", "Amin9 / G", "Bmin9 / A", "Dmaj add9", "Cmaj9 / B"] },
        { name: "Gmaj add13 / B, A♯min add13, Fmaj add13 / A, Gmaj add13 / B, A♯min add13, Fmaj add13 / A, Fmaj add13", chords: ["Gmaj add13 / B", "A♯min add13", "Fmaj add13 / A", "Gmaj add13 / B", "A♯min add13", "Fmaj add13 / A", "Fmaj add13"] },
        { name: "Cmin7, Gmin7, Fmin7, A♭maj add9 / B♭, Cmin7, Gmin7, Fmin7, Cmin7 / B♭", chords: ["Cmin7", "Gmin7", "Fmin7", "A♭maj add9 / B♭", "Cmin7", "Gmin7", "Fmin7", "Cmin7 / B♭"] },
        { name: "E♭min7, B♭min7, A♭min7, E♭min7, B♭min7, A♭min9, E♭min7", chords: ["E♭min7", "B♭min7", "A♭min7", "E♭min7", "B♭min7", "A♭min9", "E♭min7"] }
    ],
    "EDM": [
        { name: "Cmin, B♭maj, A♭maj, E♭maj, Fmin, A♭maj, B♭maj, Cmin", chords: ["Cmin", "B♭maj", "A♭maj", "E♭maj", "Fmin", "A♭maj", "B♭maj", "Cmin"] },
        { name: "E♭maj7, Fmin, E♭maj, Gmin, E♭maj7, B♭maj, Fmin, A♭maj", chords: ["E♭maj7", "Fmin", "E♭maj", "Gmin", "E♭maj7", "B♭maj", "Fmin", "A♭maj"] },
        { name: "Fmin7, A♭maj, B♭sus2, B♭maj, Fmin7, A♭maj, B♭sus2, B♭maj", chords: ["Fmin7", "A♭maj", "B♭sus2", "B♭maj", "Fmin7", "A♭maj", "B♭sus2", "B♭maj"] },
        { name: "Bmin7, Gmaj add9, Dmaj, Amaj, Bmin7, Gmaj, Dmaj, Amaj", chords: ["Bmin7", "Gmaj add9", "Dmaj", "Amaj", "Bmin7", "Gmaj", "Dmaj", "Amaj"] },
        { name: "Gmaj7, Dsus2 / E, Amaj / E, Gmaj, Gmaj7, Amaj / E, Dsus2 / E, Asus4", chords: ["Gmaj7", "Dsus2 / E", "Amaj / E", "Gmaj", "Gmaj7", "Amaj / E", "Dsus2 / E", "Asus4"] },
        { name: "Gmin7, Cmaj / G, G7(sus2), Dmin, Gmin7, Amin7, B♭maj7, Fmaj / C", chords: ["Gmin7", "Cmaj / G", "G7(sus2)", "Dmin", "Gmin7", "Amin7", "B♭maj7", "Fmaj / C"] },
        { name: "Bmin7, Bmin7 / A, Bmin7, E9(sus4), Gmaj7, Gmaj7 / D, F♯min7, Dmaj7(sus2)", chords: ["Bmin7", "Bmin7 / A", "Bmin7", "E9(sus4)", "Gmaj7", "Gmaj7 / D", "F♯min7", "Dmaj7(sus2)"] },
        { name: "Amaj, C♯min7, Dmaj, Emaj add11, F♯min7, Emaj, C♯min7, Amaj", chords: ["Amaj", "C♯min7", "Dmaj", "Emaj add11", "F♯min7", "Emaj", "C♯min7", "Amaj"] },
        { name: "Fmaj add9, Csus2, Amin7, Gmaj, Fmaj add9, Csus2, Dmin7, Fmaj", chords: ["Fmaj add9", "Csus2", "Amin7", "Gmaj", "Fmaj add9", "Csus2", "Dmin7", "Fmaj"] },
        { name: "E♭min7, D♭6(sus4), C♭maj7(sus2), A♭min, E♭min7, C♭maj7(sus2), C♭sus2, D♭5", chords: ["E♭min7", "D♭6(sus4)", "C♭maj7(sus2)", "A♭min", "E♭min7", "C♭maj7(sus2)", "C♭sus2", "D♭5"] },
        { name: "Amin, Gmaj, Cmaj / G, Amin / E", chords: ["Amin", "Gmaj", "Cmaj / G", "Amin / E"] },
        { name: "F♯min7, Amaj / E, Dmaj add9, Dmaj add9, Amaj / E, Emaj add11, F♯min7", chords: ["F♯min7", "Amaj / E", "Dmaj add9", "Dmaj add9", "Amaj / E", "Emaj add11", "F♯min7"] },
        { name: "Dmaj7, E6(sus4), C♯min7, Dmaj add9, Emaj, F♯min7, Dmaj add9", chords: ["Dmaj7", "E6(sus4)", "C♯min7", "Dmaj add9", "Emaj", "F♯min7", "Dmaj add9"] },
        { name: "B♭min11, D♭maj7, A♭maj, G♭maj add9", chords: ["B♭min11", "D♭maj7", "A♭maj", "G♭maj add9"] },
        { name: "D♭maj, G♭maj, E♭min7, C♭maj7, A♭min / E♭, G♭maj, D♭maj / A♭", chords: ["D♭maj", "G♭maj", "E♭min7", "C♭maj7", "A♭min / E♭", "G♭maj", "D♭maj / A♭"] },
        { name: "F♯min, C♯min, Dmaj, D5 maj7♯11, Emaj add9 11, F♯min", chords: ["F♯min", "C♯min", "Dmaj", "D5 maj7♯11", "Emaj add9 11", "F♯min"] },
        { name: "Gmaj add9, Dsus2, Bmin7, Amaj add11", chords: ["Gmaj add9", "Dsus2", "Bmin7", "Amaj add11"] }
    ],
    "Fixed Bass": [
        { name: "Amin, Gmaj add9 / A, Fmaj7 / A, A7(sus2), Amin7, Bmin7(♭5) / A, Dmin / A, Amin", chords: ["Amin", "Gmaj add9 / A", "Fmaj7 / A", "A7(sus2)", "Amin7", "Bmin7(♭5) / A", "Dmin / A", "Amin"] },
        { name: "Gsus2, Emin / G, G6(sus4), Gmaj7(sus2)", chords: ["Gsus2", "Emin / G", "G6(sus4)", "Gmaj7(sus2)"] },
        { name: "Cmaj, F♯dim♭9 / C, C6(sus4), Cmaj7(sus2)", chords: ["Cmaj", "F♯dim♭9 / C", "C6(sus4)", "Cmaj7(sus2)"] },
        { name: "Bmin7, Bmin13, Gmaj7 13 / B, B7(sus2)", chords: ["Bmin7", "Bmin13", "Gmaj7 13 / B", "B7(sus2)"] },
        { name: "Fmaj7, F6(sus2♭5), Dmin / F, Fmaj9(sus4), Fmaj7, B♭maj / F, Edim♭9 / F, Fmaj add9", chords: ["Fmaj7", "F6(sus2♭5)", "Dmin / F", "Fmaj9(sus4)", "Fmaj7", "B♭maj / F", "Edim♭9 / F", "Fmaj add9"] },
        { name: "Cmaj7 13 / E, Emin, Emaj7(sus2), Emin, Emin, A6(sus2) / E, Cmaj7 13 / E, E7(no3)", chords: ["Cmaj7 13 / E", "Emin", "Emaj7(sus2)", "Emin", "Emin", "A6(sus2) / E", "Cmaj7 13 / E", "E7(no3)"] },
        { name: "Gmaj, Gmaj7(sus2), Gsus4, Gmaj, Gmaj7(sus2), Gmin7, Gsus4", chords: ["Gmaj", "Gmaj7(sus2)", "Gsus4", "Gmaj", "Gmaj7(sus2)", "Gmin7", "Gsus4"] },
        { name: "Fmaj7 / A, A9(sus4), Amaj add9, Amin7, A6(sus4), Amaj add9", chords: ["Fmaj7 / A", "A9(sus4)", "Amaj add9", "Amin7", "A6(sus4)", "Amaj add9"] },
        { name: "Dmaj7, Dmin add13, Dmin, Dmin add13, Dmaj7, Dmin add13, Gmaj / D, Emin7(♭5) / D", chords: ["Dmaj7", "Dmin add13", "Dmin", "Dmin add13", "Dmaj7", "Dmin add13", "Gmaj / D", "Emin7(♭5) / D"] },
        { name: "Cmaj, Bmin♭9 / C, F6(sus4) / C, Amin / C, Cmaj, Bmin♭9 / C, F6(sus4) / C, Amin / C", chords: ["Cmaj", "Bmin♭9 / C", "F6(sus4) / C", "Amin / C", "Cmaj", "Bmin♭9 / C", "F6(sus4) / C", "Amin / C"] }
    ],
    "Future Bass": [
        { name: "Dmin, Cmaj, Emin, Fmaj, Gmaj, Amin, Cmaj, Fmaj", chords: ["Dmin", "Cmaj", "Emin", "Fmaj", "Gmaj", "Amin", "Cmaj", "Fmaj"] },
        { name: "B♭min7, Fmin11, E♭min7, D♭maj7, B♭min7, Fmin add11, E♭min7, D♭maj7, B♭min7", chords: ["B♭min7", "Fmin11", "E♭min7", "D♭maj7", "B♭min7", "Fmin add11", "E♭min7", "D♭maj7", "B♭min7"] },
        { name: "Cmin, F7(sus2) / E♭, G7, A♭maj7 / E♭, E♭maj add13 / G, B♭6(sus4), Gmaj♭9 / B, A♭maj", chords: ["Cmin", "F7(sus2) / E♭", "G7", "A♭maj7 / E♭", "E♭maj add13 / G", "B♭6(sus4)", "Gmaj♭9 / B", "A♭maj"] },
        { name: "B♭maj add13, Cmaj, Dmin7, Gmin7, Emin7(♭5), Fmaj, Amin, B♭maj", chords: ["B♭maj add13", "Cmaj", "Dmin7", "Gmin7", "Emin7(♭5)", "Fmaj", "Amin", "B♭maj"] },
        { name: "Cmin9, D♭maj7, Fmin9, G♭maj7, B♭min9, Bmaj7, E♭min9", chords: ["Cmin9", "D♭maj7", "Fmin9", "G♭maj7", "B♭min9", "Bmaj7", "E♭min9"] },
        { name: "Emaj7, G♯min7, Amaj7, C♯min7, Dmaj7, F♯min7, Gmaj7, Bmin9", chords: ["Emaj7", "G♯min7", "Amaj7", "C♯min7", "Dmaj7", "F♯min7", "Gmaj7", "Bmin9"] },
        { name: "Dmin7, Cmaj, Gmin, Gmaj, B♭maj7, Cmaj, F6(sus2) / D, Fmaj add13 / A", chords: ["Dmin7", "Cmaj", "Gmin", "Gmaj", "B♭maj7", "Cmaj", "F6(sus2) / D", "Fmaj add13 / A"] }
    ],
    "Gospel": [
        { name: "C♭maj add13, D♭maj, E♭min9, E♭min9, B♭min7, B♭min7, C♭maj7, D♭maj add13, E♭min9, E♭min, E♭min7 / D♭, E♭min / B♭, C♭maj add13, C♭maj7, D♭maj add13, G♭maj add13, E♭min7, B♭min11, B♭min11, C♭maj7(no3), D♭maj add13, G♭maj add13, E♭min7, B♭min11, B♭min11", chords: ["C♭maj add13", "D♭maj", "E♭min9", "E♭min9", "B♭min7", "B♭min7", "C♭maj7", "D♭maj add13", "E♭min9", "E♭min", "E♭min7 / D♭", "E♭min / B♭", "C♭maj add13", "C♭maj7", "D♭maj add13", "G♭maj add13", "E♭min7", "B♭min11", "B♭min11", "C♭maj7(no3)", "D♭maj add13", "G♭maj add13", "E♭min7", "B♭min11", "B♭min11"] },
        { name: "E♭min9, Fmin9, B♭min9, A♭maj9, E♭min11, Fmin9, B♭min9, A♭maj9, Emaj9♯11, E♭7, D7(♭5)♭9♯9", chords: ["E♭min9", "Fmin9", "B♭min9", "A♭maj9", "E♭min11", "Fmin9", "B♭min9", "A♭maj9", "Emaj9♯11", "E♭7", "D7(♭5)♭9♯9"] },
        { name: "C♯maj7, Ddim7, A♭dim7, F♯maj add13, E♭min7 / C♯, Gdim♯5, Gdim♯5, A♭min", chords: ["C♯maj7", "Ddim7", "A♭dim7", "F♯maj add13", "E♭min7 / C♯", "Gdim♯5", "Gdim♯5", "A♭min"] },
        { name: "Cmaj7, Amin / C, Cmaj7 / G, Bmin, Dmaj / A, Bmin, Dmaj / A, Dsus2(♭5) / E, Cmaj(no5), E7(no3) / B, F♯dim / A", chords: ["Cmaj7", "Amin / C", "Cmaj7 / G", "Bmin", "Dmaj / A", "Bmin", "Dmaj / A", "Dsus2(♭5) / E", "Cmaj(no5)", "E7(no3) / B", "F♯dim / A"] },
        { name: "Cmaj9, D7(sus2) / C, Cmaj9, D♯min maj7, Coctave, D♯tritone, Bmaj♭9, B7(♯5)♭9, Emin7, Gmaj add13, Emin7 / G, G6(sus2), Emin7 / D, Bmaj7♯9♭13, G♯7♯9 / B, D♯min♯11, G♯7♯9 / B, Emin7", chords: ["Cmaj9", "D7(sus2) / C", "Cmaj9", "D♯min maj7", "Coctave", "D♯tritone", "Bmaj♭9", "B7(♯5)♭9", "Emin7", "Gmaj add13", "Emin7 / G", "G6(sus2)", "Emin7 / D", "Bmaj7♯9♭13", "G♯7♯9 / B", "D♯min♯11", "G♯7♯9 / B", "Emin7"] },
        { name: "Fmaj7 / E, Emin7 / D, Fmaj7, Emin7, Bmaj13, Amin9, A7, Dmin7, Fmaj7, Emin7, C♯dim♯5, A♯maj9 / D", chords: ["Fmaj7 / E", "Emin7 / D", "Fmaj7", "Emin7", "Bmaj13", "Amin9", "A7", "Dmin7", "Fmaj7", "Emin7", "C♯dim♯5", "A♯maj9 / D"] },
        { name: "Emaj9, E♭7, E♭min6 11, A♭7(no3) / E♭, D♭min11, D♭min11, E♭7, E♭min6 11, E♭min6 11, Cdim♯5, E♭min6 11, D♭min, D♭min, E♭maj, D♭tritone, E♭maj(no5), Gdim / A♯, A♭7(sus4), A♭min(no5) / B, Bmaj7(no3), A♭min7", chords: ["Emaj9", "E♭7", "E♭min6 11", "A♭7(no3) / E♭", "D♭min11", "D♭min11", "E♭7", "E♭min6 11", "E♭min6 11", "Cdim♯5", "E♭min6 11", "D♭min", "D♭min", "E♭maj", "D♭tritone", "E♭maj(no5)", "Gdim / A♯", "A♭7(sus4)", "A♭min(no5) / B", "Bmaj7(no3)", "A♭min7"] },
        { name: "Gmaj9, G♭min7, G♭maj7 13, A♭sus2 / B♭, F7(sus4), E♭7(sus2) / D♭, Amaj7 11 / D, Dmaj9 / A, Bmaj13, D♭maj13", chords: ["Gmaj9", "G♭min7", "G♭maj7 13", "A♭sus2 / B♭", "F7(sus4)", "E♭7(sus2) / D♭", "Amaj7 11 / D", "Dmaj9 / A", "Bmaj13", "D♭maj13"] },
        { name: "G♯maj7, F♯maj add9 / G♯, Emaj7 / G♯, G♯9(sus4), C♯maj7 / G♯, G♯maj13, C♯maj7 / G♯, G♯9(sus4), Emaj7 / G♯, F♯maj add9 / G♯, F♯maj add9 / G♯, G♯min, G♯maj7, A♯min7 / G♯, G♯maj9, C♯maj7 / G♯, Emaj add13 / G♯, Emaj7 / G♯, Emaj7 / G♯, Emaj add13 / G♯, F♯maj add9 / G♯, F♯maj add9 / G♯, G♯min, G♯maj7, G♯maj7, D♯maj7 11 / G♯, G♯maj7", chords: ["G♯maj7", "F♯maj add9 / G♯", "Emaj7 / G♯", "G♯9(sus4)", "C♯maj7 / G♯", "G♯maj13", "C♯maj7 / G♯", "G♯9(sus4)", "Emaj7 / G♯", "F♯maj add9 / G♯", "F♯maj add9 / G♯", "G♯min", "G♯maj7", "A♯min7 / G♯", "G♯maj9", "C♯maj7 / G♯", "Emaj add13 / G♯", "Emaj7 / G♯", "Emaj7 / G♯", "Emaj add13 / G♯", "F♯maj add9 / G♯", "F♯maj add9 / G♯", "G♯min", "G♯maj7", "G♯maj7", "D♯maj7 11 / G♯", "G♯maj7"] },
        { name: "Amaj9, G♯7, C♯min11, Cdim♯5, Bmin11, Dmaj add9 / E, Amaj9, G♯7, C♯min7, C♯min7, G♯min7 / D♯, Emaj9, G♯min7, F♯min9, B7, Emaj, C♯min7, D♯min7(♭5), G♯maj, C♯min7, C♯min7, G♯min7 / D♯, Emaj add9, G♯min7", chords: ["Amaj9", "G♯7", "C♯min11", "Cdim♯5", "Bmin11", "Dmaj add9 / E", "Amaj9", "G♯7", "C♯min7", "C♯min7", "G♯min7 / D♯", "Emaj9", "G♯min7", "F♯min9", "B7", "Emaj", "C♯min7", "D♯min7(♭5)", "G♯maj", "C♯min7", "C♯min7", "G♯min7 / D♯", "Emaj add9", "G♯min7"] }
    ],
    "Hip-Hop": [
        { name: "F♯min, Emaj, Dmaj7, C♯7(sus4), C♯7(♯5)", chords: ["F♯min", "Emaj", "Dmaj7", "C♯7(sus4)", "C♯7(♯5)"] },
        { name: "Dmin9, Fmaj9, Amin9, Cmaj9", chords: ["Dmin9", "Fmaj9", "Amin9", "Cmaj9"] },
        { name: "Dmaj7(♭5), C♯min, Dmaj7(♭5), C♯min", chords: ["Dmaj7(♭5)", "C♯min", "Dmaj7(♭5)", "C♯min"] },
        { name: "C♯min add9, F♯min9, Amaj7(♭5), G♯7♭9", chords: ["C♯min add9", "F♯min9", "Amaj7(♭5)", "G♯7♭9"] },
        { name: "Fmin, B♭min, A♭maj, Cmaj / G, Cmaj", chords: ["Fmin", "B♭min", "A♭maj", "Cmaj / G", "Cmaj"] },
        { name: "Emin, Amin, Gmaj, F♯maj, Fmaj", chords: ["Emin", "Amin", "Gmaj", "F♯maj", "Fmaj"] },
        { name: "Dmaj, Fmaj add13, E♭maj7, Dmaj, Cmaj, Fmaj add13, E♭maj7, Dmaj", chords: ["Dmaj", "Fmaj add13", "E♭maj7", "Dmaj", "Cmaj", "Fmaj add13", "E♭maj7", "Dmaj"] },
        { name: "E♭maj7, E♭maj7, Fmin7, Fmin7, Gmin, Gmin7, A♭maj7, A♭maj7(sus2), A♭maj7, A♭maj7(sus2)", chords: ["E♭maj7", "E♭maj7", "Fmin7", "Fmin7", "Gmin", "Gmin7", "A♭maj7", "A♭maj7(sus2)", "A♭maj7", "A♭maj7(sus2)"] },
        { name: "Gmin, Fmaj add9 / G, E♭maj / G, Cmaj / G, Gmin, Fmaj add9 / G, E♭maj / G, Cmaj / G", chords: ["Gmin", "Fmaj add9 / G", "E♭maj / G", "Cmaj / G", "Gmin", "Fmaj add9 / G", "E♭maj / G", "Cmaj / G"] },
        { name: "Dmaj, Emaj, F♯min, Amaj, Dmaj, Emaj, F♯min, Amaj", chords: ["Dmaj", "Emaj", "F♯min", "Amaj", "Dmaj", "Emaj", "F♯min", "Amaj"] },
        { name: "Amin / C, B♭maj7, B♭maj7(sus2), Gmaj add9 / A, B♭maj7, Gmaj add9 / A, Dmin, Dmin7 / C", chords: ["Amin / C", "B♭maj7", "B♭maj7(sus2)", "Gmaj add9 / A", "B♭maj7", "Gmaj add9 / A", "Dmin", "Dmin7 / C"] },
        { name: "A♭min7, C♭maj7, E♭min9, G♭maj7 / D♭, A♭min7, C♭maj7, E♭min9, G♭maj7 / D♭", chords: ["A♭min7", "C♭maj7", "E♭min9", "G♭maj7 / D♭", "A♭min7", "C♭maj7", "E♭min9", "G♭maj7 / D♭"] },
        { name: "Gmaj, Amaj, Bmin / F♯, Dmaj, Gmaj, Amaj, Bmin / F♯, Dmaj", chords: ["Gmaj", "Amaj", "Bmin / F♯", "Dmaj", "Gmaj", "Amaj", "Bmin / F♯", "Dmaj"] },
        { name: "Cmaj, Dmaj, Emin, Dmaj add9, Cmaj, Dmaj, Emin, Dmaj add9", chords: ["Cmaj", "Dmaj", "Emin", "Dmaj add9", "Cmaj", "Dmaj", "Emin", "Dmaj add9"] }
    ],
    "House": [
        { name: "Fmaj9, Emin7, Dmin9, Cmaj9, A♯maj9, Amin9, C♯maj9, D♯maj9", chords: ["Fmaj9", "Emin7", "Dmin9", "Cmaj9", "A♯maj9", "Amin9", "C♯maj9", "D♯maj9"] },
        { name: "Gmin7, Dmin7, Fmin7, Cmin7, E♭min7, B♭min7, Cmin7, D7(sus2)", chords: ["Gmin7", "Dmin7", "Fmin7", "Cmin7", "E♭min7", "B♭min7", "Cmin7", "D7(sus2)"] },
        { name: "Amaj, Gmaj add9, F♯min, Emin11, Gmaj7(sus2) / F♯, Gmaj9, Amaj, A7(sus4)♭9 / A♯", chords: ["Amaj", "Gmaj add9", "F♯min", "Emin11", "Gmaj7(sus2) / F♯", "Gmaj9", "Amaj", "A7(sus4)♭9 / A♯"] },
        { name: "A♭maj7(no3), B♭maj add13, Fmin add9, A♭maj7(no3), Cmin", chords: ["A♭maj7(no3)", "B♭maj add13", "Fmin add9", "A♭maj7(no3)", "Cmin"] },
        { name: "A♭maj9, Fmin9, G7(♯5)♯9, Cmin9, Cmin9", chords: ["A♭maj9", "Fmin9", "G7(♯5)♯9", "Cmin9", "Cmin9"] },
        { name: "A♭maj7, B♭maj, Gmin7, A♭maj7(no3), A♭maj add13", chords: ["A♭maj7", "B♭maj", "Gmin7", "A♭maj7(no3)", "A♭maj add13"] },
        { name: "Cmin7, Fmin7, A♭maj7, E♭maj7, Cmin7, B♭maj add13, Dmin / F, E♭maj7", chords: ["Cmin7", "Fmin7", "A♭maj7", "E♭maj7", "Cmin7", "B♭maj add13", "Dmin / F", "E♭maj7"] }
    ],
    "J-K-Pop": [
        { name: "Dmaj / F♯, Emaj / G♯, Amaj, Esus4, C♯maj / F, F♯min7, C♯min7, Bmin7, E9, Asus2, G♯min7, C♯maj", chords: ["Dmaj / F♯", "Emaj / G♯", "Amaj", "Esus4", "C♯maj / F", "F♯min7", "C♯min7", "Bmin7", "E9", "Asus2", "G♯min7", "C♯maj"] },
        { name: "Dmin, Amaj / C♯, A7, B♭maj add9, D7, Gmin, Emin7(♭5), A7♭9", chords: ["Dmin", "Amaj / C♯", "A7", "B♭maj add9", "D7", "Gmin", "Emin7(♭5)", "A7♭9"] },
        { name: "E♭min, B♭min7, C♭maj, D♭maj add9, E♭min, B♭min, C♭maj, D♭maj add9", chords: ["E♭min", "B♭min7", "C♭maj", "D♭maj add9", "E♭min", "B♭min", "C♭maj", "D♭maj add9"] },
        { name: "A♭maj(no5), Gmin(no5), Fmin, E♭maj, D♭maj7(no3), C7(no3), A♭maj(no5) 9 / B♭, E♭7", chords: ["A♭maj(no5)", "Gmin(no5)", "Fmin", "E♭maj", "D♭maj7(no3)", "C7(no3)", "A♭maj(no5) 9 / B♭", "E♭7"] },
        { name: "Dmin, Cmaj, Bmin7(♭5), Emaj, Dmin, Cmaj add13, Bdim♯5, A♯maj add13, Amin", chords: ["Dmin", "Cmaj", "Bmin7(♭5)", "Emaj", "Dmin", "Cmaj add13", "Bdim♯5", "A♯maj add13", "Amin"] },
        { name: "Amin, Emaj, Gmaj, Dmaj, Fmaj, Cmaj, Dmin, Emaj, Amin, Emaj, Gmaj, Dmaj, Fmaj, Cmaj, Dmin, Cmaj, Bdim, Eaug", chords: ["Amin", "Emaj", "Gmaj", "Dmaj", "Fmaj", "Cmaj", "Dmin", "Emaj", "Amin", "Emaj", "Gmaj", "Dmaj", "Fmaj", "Cmaj", "Dmin", "Cmaj", "Bdim", "Eaug"] }
    ]
};