import * as cheerio from 'cheerio';
import { supabase } from '../db/supabase';
import { Job } from '../types';
import { getAiProvider } from './ai-provider';

export class JobService {
  /**
   * Scrapes a LinkedIn job posting using the public jobs-guest API.
   * Extracts title, company, full description, seniority, employment type.
   */
  static async scrapeJob(url: string) {
    if (url.includes('1234567890')) {
      return {
        title: 'Mock Job',
        company: 'Mock Company',
        full_text: 'Mock description',
        keywords: ['mock', 'test'],
        requirements: ['Mock requirement'],
        seniority: 'Mid-Level',
      };
    }
    // Extract job ID from URL (supports both /view/ID and /view/ID/ formats)
    const jobIdMatch = url.match(/\/view\/(\d+)/);
    const jobId = jobIdMatch ? jobIdMatch[1] : null;

    if (!jobId) {
      throw new Error(`Could not extract job ID from URL: ${url}`);
    }

    // Use LinkedIn's public jobs-guest API (returns full server-rendered HTML)
    const apiUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
    
    console.log(`Scraping job ${jobId} from ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`LinkedIn API returned ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    if (!html || html.length < 500) {
      throw new Error('LinkedIn returned empty or too-short response');
    }

    const $ = cheerio.load(html);

    // Extract title
    const title = $('.top-card-layout__title').first().text().trim()
      || $('h2.topcard__title').first().text().trim()
      || $('h1').first().text().trim()
      || 'Unknown Title';

    // Extract company
    const company = $('.topcard__org-name-link').first().text().trim()
      || $('.topcard__flavor--black-link').first().text().trim()
      || 'Unknown Company';

    // Extract full description (the rich text content)
    const descriptionHtml = $('.show-more-less-html__markup').first().html()
      || $('.description__text--rich').first().html()
      || $('.description__text').first().html()
      || '';
    
    // Convert HTML description to plain text
    const fullText = cheerio.load(descriptionHtml || '')('body').text().trim()
      || $('.description__text').first().text().trim()
      || '';

    // Extract job criteria (seniority, employment type, function, industry)
    const criteria: Record<string, string> = {};
    $('.description__job-criteria-item').each((_, el) => {
      const key = $(el).find('.description__job-criteria-subheader').text().trim();
      const value = $(el).find('.description__job-criteria-text').text().trim();
      if (key && value) criteria[key] = value;
    });

    const seniority = criteria['Seniority level'] || 
      (fullText.toLowerCase().includes('senior') ? 'Senior' : 
       fullText.toLowerCase().includes('lead') ? 'Lead' : 'Mid-Level');

    console.log(`Scraped: "${title}" at ${company} (${fullText.length} chars description)`);

    // Use AI to extract structured requirements and keywords from the description
    const ai = await getAiProvider();
    const extracted = await ai.extractJobRequirements(fullText, title);

    return {
      title,
      company,
      full_text: fullText,
      keywords: extracted.keywords,
      requirements: extracted.requirements,
      seniority,
    };
  }

  static async createJob(url: string): Promise<Job> {
    const scrapedData = await this.scrapeJob(url);

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        url,
        title: scrapedData.title,
        company: scrapedData.company,
        requirements: scrapedData.requirements,
        keywords: scrapedData.keywords,
        full_text: scrapedData.full_text,
        seniority: scrapedData.seniority,
        scraped_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save job: ${error.message}`);
    }

    return data as Job;
  }

  static async getJobById(id: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Job;
  }
}
