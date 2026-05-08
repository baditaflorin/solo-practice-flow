import type { Lead, PracticeProfile } from '../features/practice/types'

export const generateProposalScopeWithLocalLlm = async (
  lead: Lead,
  profile: PracticeProfile,
  endpoint: string,
  model: string,
) => {
  const response = await fetch(`${endpoint.replace(/\/$/, '')}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      prompt: `Write a concise consulting proposal scope for ${profile.businessName}.

Client: ${lead.company || lead.name}
Need: ${lead.need}
Budget: ${lead.budget}

Return 2 short paragraphs and avoid legal promises.`,
    }),
  })

  if (!response.ok) {
    throw new Error(`Local LLM returned ${response.status}`)
  }

  const data = (await response.json()) as { response?: string }
  return data.response?.trim() ?? ''
}
