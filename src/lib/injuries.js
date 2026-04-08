/**
 * 伤痛档案 API — 提交、查询、筛选伤害案例
 */
import { supabase } from './supabase'

/** 提交一个伤害案例（创建 post + injury_details，事务式） */
export async function submitInjuryReport({
  // post 字段
  title,
  description,
  // injury_details 字段
  bodyParts,
  injuryType,
  injuryCause,
  climbingType,
  usualGrade,
  injuryGrade,
  climbingExperience,
  climbingFrequency,
  didWarmUp,
  wasFatigued,
  soughtMedical,
  diagnosis,
  recoveryDuration,
  adviceToOthers,
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: '请先登录' } }

  // 1. 创建 post
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      title,
      description,
      climbing_type: climbingType,
      grade: injuryGrade,
    })
    .select()
    .single()

  if (postError) return { error: postError }

  // 2. 创建 injury_details
  const { data: details, error: detailsError } = await supabase
    .from('injury_details')
    .insert({
      post_id: post.id,
      body_parts: bodyParts,
      injury_type: injuryType,
      injury_cause: injuryCause,
      climbing_type: climbingType,
      usual_grade: usualGrade,
      injury_grade: injuryGrade,
      climbing_experience: climbingExperience,
      climbing_frequency: climbingFrequency,
      did_warm_up: didWarmUp,
      was_fatigued: wasFatigued,
      sought_medical: soughtMedical,
      diagnosis,
      recovery_duration: recoveryDuration,
      advice_to_others: adviceToOthers,
    })
    .select()
    .single()

  if (detailsError) {
    // 回滚：删除刚创建的 post
    await supabase.from('posts').delete().eq('id', post.id)
    return { error: detailsError }
  }

  return { data: { post, details }, error: null }
}

/** 获取伤害案例列表（含筛选） */
export async function fetchInjuryReports({
  page = 1,
  pageSize = 20,
  bodyPart,
  climbingType,
} = {}) {
  let query = supabase
    .from('posts')
    .select(`
      id, title, description, created_at, user_id, climbing_type, grade,
      profiles:user_id ( id, username, avatar_url ),
      injury_details!inner ( body_parts, injury_type, climbing_type ),
      media ( id, storage_path, media_type, display_order ),
      likes ( user_id ),
      comments ( id )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (climbingType) {
    query = query.eq('injury_details.climbing_type', climbingType)
  }

  if (bodyPart) {
    query = query.contains('injury_details.body_parts', [bodyPart])
  }

  const { data, error } = await query
  return { data, error }
}

/** 获取单个伤害案例详情（轻量版：不含评论） */
export async function fetchInjuryReport(postId) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id ( id, username, avatar_url, climbing_level ),
      injury_details ( * ),
      media ( id, storage_path, media_type, mime_type, display_order ),
      likes ( user_id )
    `)
    .eq('id', postId)
    .single()

  return { data, error }
}

/** 单独获取评论（延迟加载） */
export async function fetchInjuryComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id ( id, username, avatar_url )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  return { data: data || [], error }
}

/** 获取下一篇伤害案例（按时间排序，比当前更早的那一篇） */
export async function fetchNextInjuryId(currentPostId, currentCreatedAt) {
  const { data } = await supabase
    .from('posts')
    .select('id, created_at, injury_details!inner(id)')
    .eq('is_published', true)
    .lt('created_at', currentCreatedAt)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (data) return data.id

  // 如果没有更早的，回到最新的一篇（循环）
  const { data: first } = await supabase
    .from('posts')
    .select('id, created_at, injury_details!inner(id)')
    .eq('is_published', true)
    .neq('id', currentPostId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return first?.id || null
}

/** 获取上一篇伤害案例（按时间排序，比当前更新的那一篇） */
export async function fetchPrevInjuryId(currentPostId, currentCreatedAt) {
  const { data } = await supabase
    .from('posts')
    .select('id, created_at, injury_details!inner(id)')
    .eq('is_published', true)
    .gt('created_at', currentCreatedAt)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (data) return data.id

  // 如果没有更新的，回到最旧的一篇（循环）
  const { data: last } = await supabase
    .from('posts')
    .select('id, created_at, injury_details!inner(id)')
    .eq('is_published', true)
    .neq('id', currentPostId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  return last?.id || null
}

/** 更新自己的伤害案例 */
export async function updateInjuryReport(postId, {
  title, description, bodyParts, injuryType, injuryCause,
  climbingType, usualGrade, injuryGrade, climbingExperience,
  climbingFrequency, didWarmUp, wasFatigued, soughtMedical,
  diagnosis, recoveryDuration, adviceToOthers,
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: '请先登录' } }

  // 更新 post
  const { error: postError } = await supabase
    .from('posts')
    .update({
      title,
      description,
      climbing_type: climbingType,
      grade: injuryGrade,
    })
    .eq('id', postId)
    .eq('user_id', user.id)

  if (postError) return { error: postError }

  // 更新 injury_details
  const { error: detailsError } = await supabase
    .from('injury_details')
    .update({
      body_parts: bodyParts,
      injury_type: injuryType,
      injury_cause: injuryCause,
      climbing_type: climbingType,
      usual_grade: usualGrade,
      injury_grade: injuryGrade,
      climbing_experience: climbingExperience,
      climbing_frequency: climbingFrequency,
      did_warm_up: didWarmUp,
      was_fatigued: wasFatigued,
      sought_medical: soughtMedical,
      diagnosis,
      recovery_duration: recoveryDuration,
      advice_to_others: adviceToOthers,
    })
    .eq('post_id', postId)

  if (detailsError) return { error: detailsError }

  return { data: { id: postId }, error: null }
}

/** 删除自己的伤害案例（级联删除 injury_details、media、likes、comments） */
export async function deleteInjuryReport(postId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: '请先登录' } }

  // 先删除关联的媒体文件（storage）
  const { data: mediaFiles } = await supabase
    .from('media')
    .select('storage_path')
    .eq('post_id', postId)

  if (mediaFiles?.length > 0) {
    const paths = mediaFiles.map(m => m.storage_path)
    await supabase.storage.from('community-media').remove(paths)
  }

  // 删除关联表数据
  await supabase.from('comments').delete().eq('post_id', postId)
  await supabase.from('likes').delete().eq('post_id', postId)
  await supabase.from('media').delete().eq('post_id', postId)
  await supabase.from('injury_details').delete().eq('post_id', postId)

  // 最后删除 post（RLS 保证只能删自己的）
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', user.id)

  return { error }
}

/** 获取伤痛档案的统计数据 */
export async function fetchInjuryStats() {
  const { count } = await supabase
    .from('injury_details')
    .select('*', { count: 'exact', head: true })

  return { totalReports: count || 0 }
}

// 表单选项常量
export const BODY_PARTS = [
  // 上肢
  { value: 'finger', label: { zh: '手指', en: 'Finger', ko: '손가락' } },
  { value: 'palm', label: { zh: '手掌', en: 'Palm', ko: '손바닥' } },
  { value: 'back-of-hand', label: { zh: '手背', en: 'Back of Hand', ko: '손등' } },
  { value: 'wrist', label: { zh: '手腕', en: 'Wrist', ko: '손목' } },
  { value: 'forearm', label: { zh: '前臂', en: 'Forearm', ko: '전완' } },
  { value: 'elbow', label: { zh: '肘部', en: 'Elbow', ko: '팔꿈치' } },
  { value: 'shoulder', label: { zh: '肩膀', en: 'Shoulder', ko: '어깨' } },
  // 躯干
  { value: 'neck', label: { zh: '颈部', en: 'Neck', ko: '목' } },
  { value: 'back', label: { zh: '背部', en: 'Back', ko: '등' } },
  { value: 'waist', label: { zh: '腰部', en: 'Lower Back', ko: '허리' } },
  { value: 'hip', label: { zh: '髋部', en: 'Hip', ko: '고관절' } },
  // 下肢
  { value: 'knee', label: { zh: '膝盖', en: 'Knee', ko: '무릎' } },
  { value: 'shin', label: { zh: '小腿', en: 'Shin', ko: '정강이' } },
  { value: 'ankle', label: { zh: '脚踝', en: 'Ankle', ko: '발목' } },
  { value: 'foot', label: { zh: '脚部', en: 'Foot', ko: '발' } },
  // 其他
  { value: 'head', label: { zh: '头部', en: 'Head', ko: '머리' } },
  { value: 'other', label: { zh: '其他', en: 'Other', ko: '기타' } },
]

export const INJURY_TYPES = [
  // 皮肤相关
  { value: 'abrasion', label: { zh: '皮肤擦伤', en: 'Abrasion / Flapper', ko: '찰과상 / 플래퍼' } },
  { value: 'skin_tear', label: { zh: '皮肤撕裂', en: 'Skin Tear', ko: '피부 찢어짐' } },
  { value: 'blister', label: { zh: '水泡', en: 'Blister', ko: '물집' } },
  // 肌肉与软组织
  { value: 'strain', label: { zh: '拉伤', en: 'Strain', ko: '근육 염좌' } },
  { value: 'sprain', label: { zh: '扭伤', en: 'Sprain', ko: '인대 염좌' } },
  { value: 'contusion', label: { zh: '挫伤 / 淤青', en: 'Contusion / Bruise', ko: '타박상' } },
  { value: 'cramp', label: { zh: '肌肉痉挛', en: 'Muscle Cramp', ko: '근육 경련' } },
  // 肌腱与韧带
  { value: 'tendinitis', label: { zh: '肌腱炎', en: 'Tendinitis', ko: '건염' } },
  { value: 'pulley_injury', label: { zh: '滑车韧带损伤', en: 'Pulley Injury', ko: '풀리 인대 손상' } },
  { value: 'ligament_tear', label: { zh: '韧带撕裂', en: 'Ligament Tear', ko: '인대 파열' } },
  // 关节与骨骼
  { value: 'dislocation', label: { zh: '脱臼', en: 'Dislocation', ko: '탈구' } },
  { value: 'fracture', label: { zh: '骨折', en: 'Fracture', ko: '골절' } },
  { value: 'bursitis', label: { zh: '滑囊炎', en: 'Bursitis', ko: '점액낭염' } },
  // 神经
  { value: 'nerve', label: { zh: '神经压迫 / 麻木', en: 'Nerve Compression', ko: '신경 압박 / 저림' } },
  // 其他
  { value: 'other', label: { zh: '其他', en: 'Other', ko: '기타' } },
]

export const CLIMBING_TYPES = [
  { value: 'bouldering', label: { zh: '抱石', en: 'Bouldering', ko: '볼더링' } },
  { value: 'sport', label: { zh: '运动攀', en: 'Sport Climbing', ko: '스포츠 클라이밍' } },
  { value: 'trad', label: { zh: '传统攀', en: 'Trad Climbing', ko: '트래드 클라이밍' } },
  { value: 'top-rope', label: { zh: '顶绳', en: 'Top Rope', ko: '톱로프' } },
  { value: 'indoor', label: { zh: '室内', en: 'Indoor', ko: '실내' } },
]

export const EXPERIENCE_LEVELS = [
  { value: '<6m', label: { zh: '< 6 个月', en: '< 6 months', ko: '6개월 미만' } },
  { value: '6-12m', label: { zh: '6–12 个月', en: '6–12 months', ko: '6–12개월' } },
  { value: '1-2y', label: { zh: '1–2 年', en: '1–2 years', ko: '1–2년' } },
  { value: '2-5y', label: { zh: '2–5 年', en: '2–5 years', ko: '2–5년' } },
  { value: '5y+', label: { zh: '5 年以上', en: '5+ years', ko: '5년 이상' } },
]

export const FREQUENCY_OPTIONS = [
  { value: '1', label: { zh: '每周 1 次', en: '1x / week', ko: '주 1회' } },
  { value: '2-3', label: { zh: '每周 2–3 次', en: '2–3x / week', ko: '주 2–3회' } },
  { value: '4-5', label: { zh: '每周 4–5 次', en: '4–5x / week', ko: '주 4–5회' } },
  { value: '6+', label: { zh: '每周 6 次以上', en: '6+x / week', ko: '주 6회 이상' } },
]

export const RECOVERY_DURATIONS = [
  { value: '<1w', label: { zh: '< 1 周', en: '< 1 week', ko: '1주 미만' } },
  { value: '1-4w', label: { zh: '1–4 周', en: '1–4 weeks', ko: '1–4주' } },
  { value: '1-3m', label: { zh: '1–3 个月', en: '1–3 months', ko: '1–3개월' } },
  { value: '3-6m', label: { zh: '3–6 个月', en: '3–6 months', ko: '3–6개월' } },
  { value: '6m+', label: { zh: '6 个月以上', en: '6+ months', ko: '6개월 이상' } },
  { value: 'ongoing', label: { zh: '至今未完全恢复', en: 'Still recovering', ko: '아직 회복 중' } },
]
