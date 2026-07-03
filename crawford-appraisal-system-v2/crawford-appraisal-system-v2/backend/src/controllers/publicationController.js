const { supabase } = require('../config/supabase');

// Publication type available scores
const PUBLICATION_SCORES = {
  journal_article: 3,
  refereed_book: 4,
  edited_book: 3,
  chapter_in_book: 2,
  conference_proceedings: 2,
  conference_paper: 2,
  review_editorship: 1,
  technical_report: 1,
  monograph: 2
};

// Authorship conversion factors
const AUTHORSHIP_FACTOR = {
  sole: 1.0,
  lead: 1.0,
  co_author: 0.8
};

// C values per target rank
const C_VALUES = {
  'Senior Lecturer': 45,
  'Associate Professor': 60,
  'Professor': 75
};

// Upload a publication
const uploadPublication = async (req, res) => {
  try {
    const {
      title,
      publication_type,
      journal_name,
      publisher,
      year_of_publication,
      authorship_position,
      is_international,
      isbn_issn,
      doi,
      is_acceptance_letter,
      acceptance_letter_date
    } = req.body;

    // Validate required fields
    if (!title || !publication_type || !authorship_position) {
      return res.status(400).json({
        error: 'Title, publication type, and authorship position are required.'
      });
    }

    // Calculate available score and points scored
    const baseScore = PUBLICATION_SCORES[publication_type] || 0;
    const factor = AUTHORSHIP_FACTOR[authorship_position] || 0.8;
    const available_score = baseScore;
    const points_scored = baseScore * factor;

    // Handle file upload to Supabase Storage
    let file_url = null;
    let file_name = null;
    let file_size = null;

    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileName = `publications/${req.user.id}/${Date.now()}_${req.file.originalname}`;

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('publications')
        .upload(fileName, fileBuffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase
        .storage
        .from('publications')
        .getPublicUrl(fileName);

      file_url = urlData.publicUrl;
      file_name = req.file.originalname;
      file_size = req.file.size;
    }

    const { data, error } = await supabase
      .from('publications')
      .insert({
        staff_id: req.user.id,
        title,
        publication_type,
        journal_name,
        publisher,
        year_of_publication,
        authorship_position,
        is_international: is_international || false,
        isbn_issn,
        doi,
        is_acceptance_letter: is_acceptance_letter || false,
        acceptance_letter_date: acceptance_letter_date || null,
        file_url,
        file_name,
        file_size,
        available_score,
        points_scored,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Publication uploaded successfully.',
      publication: data
    });
  } catch (error) {
    console.error('Upload publication error:', error);
    res.status(500).json({ error: 'Failed to upload publication.' });
  }
};

// Get all publications for logged-in staff
const getMyPublications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .eq('staff_id', req.user.id)
      .order('year_of_publication', { ascending: false });

    if (error) throw error;

    // Calculate total publication points
    const totalAvailable = data.reduce((sum, p) => sum + (p.available_score || 0), 0);
    const totalScored = data.reduce((sum, p) => sum + (p.points_scored || 0), 0);

    res.json({
      publications: data,
      summary: {
        total_publications: data.length,
        total_available_score: totalAvailable,
        total_scored: totalScored
      }
    });
  } catch (error) {
    console.error('Get publications error:', error);
    res.status(500).json({ error: 'Failed to fetch publications.' });
  }
};

// Get publications for a specific staff (A&PC and admin only)
const getStaffPublications = async (req, res) => {
  try {
    const { staffId } = req.params;

    const { data, error } = await supabase
      .from('publications')
      .select('*, users!publications_staff_id_fkey(full_name, department, current_rank)')
      .eq('staff_id', staffId)
      .eq('status', 'active')
      .order('year_of_publication', { ascending: false });

    if (error) throw error;
    res.json({ publications: data });
  } catch (error) {
    console.error('Get staff publications error:', error);
    res.status(500).json({ error: 'Failed to fetch staff publications.' });
  }
};

// Calculate publication points for a staff member
const calculatePublicationPoints = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { target_rank } = req.query;

    const { data: publications, error } = await supabase
      .from('publications')
      .select('*')
      .eq('staff_id', staffId)
      .eq('status', 'active')
      .eq('is_predatory', false);

    if (error) throw error;

    const C = C_VALUES[target_rank] || 40;

    // Sum A (available scores) and B (points scored)
    const sumA = publications.reduce((sum, p) => sum + (p.available_score || 0), 0);
    const sumB = publications.reduce((sum, p) => sum + (p.points_scored || 0), 0);

    // PTS = (B/A) * C
    const PTS = sumA > 0 ? (sumB / sumA) * C : 0;

    // PP = (PTS/C) * 40
    const PP = C > 0 ? (PTS / C) * 40 : 0;

    // Get minimum required points for target rank
    const MIN_POINTS = {
      'Lecturer II': 10,
      'Lecturer I': 16,
      'Senior Lecturer': 22,
      'Associate Professor': 26,
      'Professor': 30
    };

    const minRequired = MIN_POINTS[target_rank] || 0;
    const meetsRequirement = PP >= minRequired;

    res.json({
      staff_id: staffId,
      target_rank,
      total_publications: publications.length,
      sum_available_scores: Math.round(sumA * 100) / 100,
      sum_points_scored: Math.round(sumB * 100) / 100,
      C_value: C,
      PTS: Math.round(PTS * 100) / 100,
      publication_points_PP: Math.round(PP * 100) / 100,
      minimum_required: minRequired,
      meets_requirement: meetsRequirement
    });
  } catch (error) {
    console.error('Calculate publication points error:', error);
    res.status(500).json({ error: 'Failed to calculate publication points.' });
  }
};

// Delete a publication
const deletePublication = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: publication } = await supabase
      .from('publications')
      .select('*')
      .eq('id', id)
      .eq('staff_id', req.user.id)
      .single();

    if (!publication) {
      return res.status(404).json({ error: 'Publication not found.' });
    }

    // Delete file from storage if exists
    if (publication.file_url) {
      const filePath = publication.file_url.split('/publications/')[1];
      await supabase.storage.from('publications').remove([`publications/${filePath}`]);
    }

    const { error } = await supabase
      .from('publications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Publication deleted successfully.' });
  } catch (error) {
    console.error('Delete publication error:', error);
    res.status(500).json({ error: 'Failed to delete publication.' });
  }
};

module.exports = {
  uploadPublication,
  getMyPublications,
  getStaffPublications,
  calculatePublicationPoints,
  deletePublication
};
