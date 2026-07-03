const { supabase } = require('../config/supabase');

const PUBLICATION_SCORES = {
  journal_article: 3, refereed_book: 4, edited_book: 3, chapter_in_book: 2,
  conference_proceedings: 2, conference_paper: 2, review_editorship: 1, technical_report: 1, monograph: 2,
};
const AUTHORSHIP_FACTOR = { sole: 1.0, lead: 1.0, co_author: 0.8 };
const C_VALUES = { 'Senior Lecturer': 45, 'Associate Professor': 60, 'Professor': 75 };
const MIN_POINTS = { 'Lecturer II': 10, 'Lecturer I': 16, 'Senior Lecturer': 22, 'Associate Professor': 26, 'Professor': 30 };

const uploadPublication = async (req, res) => {
  try {
    const { title, publication_type, journal_name, publisher, year_of_publication,
      authorship_position, is_international, isbn_issn, doi, is_acceptance_letter, acceptance_letter_date } = req.body;

    if (!title || !publication_type || !authorship_position) {
      return res.status(400).json({ error: 'Title, publication type, and authorship position are required.' });
    }

    const baseScore = PUBLICATION_SCORES[publication_type] || 0;
    const factor = AUTHORSHIP_FACTOR[authorship_position] || 0.8;
    const available_score = baseScore;
    const points_scored = baseScore * factor;

    let file_url = null, file_name = null, file_size = null;
    if (req.file) {
      const fileName = `publications/${req.user.id}/${Date.now()}_${req.file.originalname}`;
      const { error: uploadError } = await supabase.storage.from('publications')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('publications').getPublicUrl(fileName);
      file_url = urlData.publicUrl;
      file_name = req.file.originalname;
      file_size = req.file.size;
    }

    const { data, error } = await supabase.from('publications').insert({
      staff_id: req.user.id, title, publication_type, journal_name, publisher,
      year_of_publication: year_of_publication ? parseInt(year_of_publication) : null,
      authorship_position, is_international: is_international === 'true' || is_international === true,
      isbn_issn, doi,
      is_acceptance_letter: is_acceptance_letter === 'true' || is_acceptance_letter === true,
      acceptance_letter_date: acceptance_letter_date || null,
      file_url, file_name, file_size, available_score, points_scored, status: 'active',
    }).select().single();
    if (error) throw error;

    res.status(201).json({ message: 'Publication uploaded successfully.', publication: data });
  } catch (err) {
    console.error('Upload publication error:', err);
    res.status(500).json({ error: 'Failed to upload publication.' });
  }
};

const getMyPublications = async (req, res) => {
  try {
    const { data, error } = await supabase.from('publications').select('*')
      .eq('staff_id', req.user.id).order('year_of_publication', { ascending: false });
    if (error) throw error;

    const totalAvailable = data.reduce((s, p) => s + (p.available_score || 0), 0);
    const totalScored = data.reduce((s, p) => s + (p.points_scored || 0), 0);
    res.json({ publications: data, summary: { total_publications: data.length, total_available_score: totalAvailable, total_scored: totalScored } });
  } catch (err) {
    console.error('Get publications error:', err);
    res.status(500).json({ error: 'Failed to fetch publications.' });
  }
};

const getStaffPublications = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { data, error } = await supabase.from('publications').select('*')
      .eq('staff_id', staffId).eq('status', 'active').order('year_of_publication', { ascending: false });
    if (error) throw error;
    res.json({ publications: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff publications.' });
  }
};

const calculatePublicationPoints = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { target_rank } = req.query;
    const { data: publications, error } = await supabase.from('publications').select('*')
      .eq('staff_id', staffId).eq('status', 'active').eq('is_predatory', false);
    if (error) throw error;

    const C = C_VALUES[target_rank] || 40;
    const sumA = publications.reduce((s, p) => s + (p.available_score || 0), 0);
    const sumB = publications.reduce((s, p) => s + (p.points_scored || 0), 0);
    const PTS = sumA > 0 ? (sumB / sumA) * C : 0;
    const PP = C > 0 ? (PTS / C) * 40 : 0;

    res.json({
      staff_id: staffId, target_rank,
      total_publications: publications.length,
      sum_available_scores: Math.round(sumA * 100) / 100,
      sum_points_scored: Math.round(sumB * 100) / 100,
      C_value: C, PTS: Math.round(PTS * 100) / 100,
      publication_points_PP: Math.round(PP * 100) / 100,
      minimum_required: MIN_POINTS[target_rank] || 0,
      meets_requirement: PP >= (MIN_POINTS[target_rank] || 0),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate publication points.' });
  }
};

const getDepartmentPublications = async (req, res) => {
  try {
    const isAcademicHOD = req.user.staff_category === 'academic';
    const accessibleCategories = isAcademicHOD
      ? ['academic']
      : ['senior_nonteaching', 'junior_nonteaching'];

    const { data: deptStaff, error: staffErr } = await supabase
      .from('users').select('id')
      .eq('department', req.user.department)
      .in('staff_category', accessibleCategories)
      .neq('id', req.user.id);
    if (staffErr) throw staffErr;

    const staffIds = (deptStaff || []).map(u => u.id);
    if (staffIds.length === 0) return res.json({ publications: [] });

    const { data, error } = await supabase.from('publications')
      .select('*, users!publications_staff_id_fkey(full_name, current_rank, department)')
      .in('staff_id', staffIds)
      .eq('status', 'active')
      .order('year_of_publication', { ascending: false });
    if (error) throw error;
    res.json({ publications: data });
  } catch (err) {
    console.error('Get department publications error:', err);
    res.status(500).json({ error: 'Failed to fetch department publications.' });
  }
};

const getCollegePublications = async (req, res) => {
  try {
    const { data: collegeStaff, error: staffErr } = await supabase
      .from('users').select('id')
      .eq('college', req.user.college)
      .neq('id', req.user.id);
    if (staffErr) throw staffErr;

    const staffIds = (collegeStaff || []).map(u => u.id);
    if (staffIds.length === 0) return res.json({ publications: [] });

    const { data, error } = await supabase.from('publications')
      .select('*, users!publications_staff_id_fkey(full_name, current_rank, department)')
      .in('staff_id', staffIds)
      .eq('status', 'active')
      .order('year_of_publication', { ascending: false });
    if (error) throw error;
    res.json({ publications: data });
  } catch (err) {
    console.error('Get college publications error:', err);
    res.status(500).json({ error: 'Failed to fetch college publications.' });
  }
};

const deletePublication = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: pub } = await supabase.from('publications').select('*').eq('id', id).eq('staff_id', req.user.id).single();
    if (!pub) return res.status(404).json({ error: 'Publication not found.' });

    if (pub.file_url) {
      const path = pub.file_url.split('/object/public/publications/')[1];
      if (path) await supabase.storage.from('publications').remove([path]);
    }

    const { error } = await supabase.from('publications').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Publication deleted successfully.' });
  } catch (err) {
    console.error('Delete publication error:', err);
    res.status(500).json({ error: 'Failed to delete publication.' });
  }
};

module.exports = { uploadPublication, getMyPublications, getStaffPublications, getDepartmentPublications, getCollegePublications, calculatePublicationPoints, deletePublication };
