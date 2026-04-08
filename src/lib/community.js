/**
 * 社区功能 API — 帖子、评论、点赞、媒体上传
 */
import { supabase } from './supabase'

// ─── 帖子 ───────────────────────────────────────────────

/** 获取帖子列表（含作者信息和统计） */
export async function fetchPosts({ page = 1, pageSize = 20, climbingType } = {}) {
  let query = supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id ( id, username, avatar_url, climbing_level ),
      media ( id, storage_path, media_type, display_order ),
      post_knowledge_points ( kp_id ),
      likes ( user_id ),
      comments ( id )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (climbingType) {
    query = query.eq('climbing_type', climbingType)
  }

  const { data, error } = await query
  return { data, error }
}

/** 获取单个帖子详情 */
export async function fetchPost(postId) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id ( id, username, avatar_url, climbing_level, bio ),
      media ( id, storage_path, media_type, mime_type, duration_seconds, display_order ),
      post_knowledge_points ( kp_id, tagged_by ),
      likes ( user_id )
    `)
    .eq('id', postId)
    .single()
  return { data, error }
}

/** 创建帖子 */
export async function createPost({ title, description, climbingType, grade, location }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: '请先登录' } }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      title,
      description,
      climbing_type: climbingType,
      grade,
      location,
    })
    .select()
    .single()
  return { data, error }
}

/** 删除帖子 */
export async function deletePost(postId) {
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  return { error }
}

// ─── 媒体上传 ────────────────────────────────────────────

/** 上传文件到 Storage 并在 media 表中记录 */
export async function uploadMedia(postId, file, displayOrder = 0) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: '请先登录' } }

  const fileExt = file.name.split('.').pop()
  const filePath = `${user.id}/${postId}/${Date.now()}.${fileExt}`

  // 1. 上传到 Storage
  const { error: uploadError } = await supabase.storage
    .from('community-media')
    .upload(filePath, file)

  if (uploadError) return { error: uploadError }

  // 2. 获取公开 URL
  const { data: { publicUrl } } = supabase.storage
    .from('community-media')
    .getPublicUrl(filePath)

  // 3. 在 media 表中记录
  const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
  const { data, error } = await supabase
    .from('media')
    .insert({
      post_id: postId,
      storage_path: filePath,
      media_type: mediaType,
      mime_type: file.type,
      file_size_bytes: file.size,
      display_order: displayOrder,
    })
    .select()
    .single()

  return { data: data ? { ...data, publicUrl } : null, error }
}

// ─── 评论 ───────────────────────────────────────────────

/** 获取帖子的评论列表 */
export async function fetchComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id ( id, username, avatar_url )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  return { data, error }
}

/** 发表评论 */
export async function createComment(postId, content, parentCommentId = null) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: '请先登录' } }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
      parent_comment_id: parentCommentId,
    })
    .select(`
      *,
      profiles:user_id ( id, username, avatar_url )
    `)
    .single()
  return { data, error }
}

/** 删除评论 */
export async function deleteComment(commentId) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  return { error }
}

// ─── 点赞 ───────────────────────────────────────────────

/** 切换点赞状态（已赞则取消，未赞则添加） */
export async function toggleLike(postId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: '请先登录' } }

  // 检查是否已点赞
  const { data: existing } = await supabase
    .from('likes')
    .select('user_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // 取消点赞
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id)
    return { liked: false, error }
  } else {
    // 添加点赞
    const { error } = await supabase
      .from('likes')
      .insert({ user_id: user.id, post_id: postId })
    return { liked: true, error }
  }
}

// ─── 知识点标注 ──────────────────────────────────────────

/** 给帖子添加知识点标注 */
export async function tagKnowledgePoint(postId, kpId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: '请先登录' } }

  const { data, error } = await supabase
    .from('post_knowledge_points')
    .insert({ post_id: postId, kp_id: kpId, tagged_by: user.id })
    .select()
    .single()
  return { data, error }
}

/** 移除知识点标注 */
export async function untagKnowledgePoint(postId, kpId) {
  const { error } = await supabase
    .from('post_knowledge_points')
    .delete()
    .eq('post_id', postId)
    .eq('kp_id', kpId)
  return { error }
}
