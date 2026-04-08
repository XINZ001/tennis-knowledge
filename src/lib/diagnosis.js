/**
 * 攀岩动物人格诊断 API — 保存 & 查询诊断结果
 */
import { supabase } from './supabase'

/** 保存一次诊断结果 */
export async function saveDiagnosisResult({ answers, personaId, fusionRuleIds }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: '请先登录' } }

  const { data, error } = await supabase
    .from('diagnosis_results')
    .insert({
      user_id: user.id,
      answers,
      persona_id: personaId,
      fusion_rule_ids: fusionRuleIds || [],
    })
    .select()
    .single()

  return { data, error }
}

/** 获取当前用户的最近一次诊断结果 */
export async function getLatestDiagnosis() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: null }

  const { data, error } = await supabase
    .from('diagnosis_results')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return { data, error }
}

/** 获取当前用户的所有诊断历史 */
export async function getDiagnosisHistory() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }

  const { data, error } = await supabase
    .from('diagnosis_results')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return { data: data || [], error }
}
