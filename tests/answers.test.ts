import { describe, expect, it } from 'vitest';
import { gradeTerm, maskTerm, spokenForm, spokenScore, termForms } from '@/learning/answer';
import { phraseHits } from '@/learning/situations';
import { mergeTranscripts, splitForSpeech } from '@/lib/speechText';
import { listenErrorCode } from '@/lib/speech';

describe('typed term answers', () => {
  it('accepts the full form, the part before the parenthesis and its acronym or expansion', () => {
    const t = 'MCP (Model Context Protocol)';
    expect(gradeTerm('MCP (Model Context Protocol)', t)).toBe('exact');
    expect(gradeTerm('mcp', t)).toBe('exact');
    expect(gradeTerm('model context protocol', t)).toBe('exact');
    expect(gradeTerm('Content Security Policy', 'Content Security Policy (CSP)')).toBe('exact');
    expect(gradeTerm('CSP', 'Content Security Policy (CSP)')).toBe('exact');
    expect(gradeTerm('m-commerce', 'mobile commerce (m-commerce)')).toBe('exact');
  });

  it('a context note in parentheses is not an answer', () => {
    expect(gradeTerm('tag', 'tag (on social media)')).toBe('exact');
    expect(gradeTerm('on social media', 'tag (on social media)')).toBe('wrong');
    expect(gradeTerm('Git', 'tag (Git)')).toBe('wrong');
    expect(gradeTerm('CRM', 'account (CRM)')).toBe('wrong');
  });

  it('accepts each side of a slash, but keeps compound terms whole', () => {
    expect(gradeTerm('SSL', 'SSL/TLS')).toBe('exact');
    expect(gradeTerm('tls', 'SSL/TLS')).toBe('exact');
    expect(gradeTerm('ssl/tls', 'SSL/TLS')).toBe('exact');
    expect(gradeTerm('closed lost', 'closed won / closed lost')).toBe('exact');
    expect(termForms('A/B test')).toEqual(['A/B test']);
    expect(gradeTerm('CD pipeline', 'CI/CD pipeline')).toBe('wrong');
  });

  it('still tolerates a small typo on long forms', () => {
    expect(gradeTerm('model context protocl', 'MCP (Model Context Protocol)')).toBe('typo');
    expect(gradeTerm('MPC', 'MCP (Model Context Protocol)')).toBe('wrong');
  });

  it('reads only the part before the parenthesis aloud', () => {
    expect(spokenForm('MCP (Model Context Protocol)')).toBe('MCP');
    expect(spokenForm('tag (on social media)')).toBe('tag');
    expect(spokenForm('SSL/TLS')).toBe('SSL/TLS');
  });

  it('masks the answer in a hint, whatever the case', () => {
    expect(maskTerm('Le Model Context Protocol (MCP) relie un modèle à des outils.', 'MCP (Model Context Protocol)'))
      .toBe('Le … (…) relie un modèle à des outils.');
    expect(maskTerm('Un TAG sur une photo. Le mot stage reste.', 'tag (on social media)')).toBe('Un … sur une photo. Le mot stage reste.');
  });
});

describe('contractions in spoken and written answers', () => {
  it('spokenScore treats "we will" and "we\'ll" as the same words', () => {
    expect(spokenScore('we will deploy it tonight', "We'll deploy it tonight.")).toBe(1);
    expect(spokenScore('I’ll check the logs', 'I will check the logs')).toBe(1);
  });

  it('phraseHits finds key phrases said with or without contraction', () => {
    expect(phraseHits('I am blocked by the API team', ['I’m blocked', 'roll back'])).toEqual([true, false]);
    expect(phraseHits("We'll roll back the release", ['we will roll back'])).toEqual([true]);
    expect(phraseHits('we use end to end tests', ['end-to-end tests'])).toEqual([true]);
  });
});

describe('speech helpers', () => {
  it('drops the repeated prefixes Chrome Android sends in continuous mode', () => {
    expect(mergeTranscripts(['I will', 'I will deploy', 'I will deploy the fix'])).toBe('I will deploy the fix');
    expect(mergeTranscripts(['I will deploy the fix', 'tonight'])).toBe('I will deploy the fix tonight');
    expect(mergeTranscripts(['I will deploy the fix', 'I will deploy the fix tonight'])).toBe('I will deploy the fix tonight');
    expect(mergeTranscripts(['', '  '])).toBe('');
  });

  it('splits long texts into short utterances, keeps short ones whole', () => {
    expect(splitForSpeech('Hello there. We use Node.js daily.')).toEqual(['Hello there. We use Node.js daily.']);
    const long = 'First sentence is here and it is long enough. '.repeat(6).trim();
    const parts = splitForSpeech(long, 80);
    expect(parts.length).toBe(6);
    expect(parts.every((p) => p.length <= 80)).toBe(true);
  });

  it('classifies a refused speech service as unsupported, not as a refused microphone', () => {
    expect(listenErrorCode('service-not-allowed')).toBe('unsupported');
    expect(listenErrorCode('not-allowed')).toBe('not-allowed');
    expect(listenErrorCode('aborted')).toBe('aborted');
  });
});
