export interface UserGoalData {
  bodyGoal: 'weight_loss' | 'muscle_gain' | 'six_pack' | 'bodybuilder' | 'fit_active' | 'bulk';
  currentWeight: number;
  goalWeight: number;
  timeline: string;
  currentBodyType: 'slim' | 'average' | 'overweight' | 'obese' | 'athletic';
  specificNotes?: string;
  gender?: 'male' | 'female';
}

export const GOAL_DESCRIPTIONS = {
  weight_loss: 'lean, toned physique with visible muscle definition, reduced body fat, flat stomach, slim waist, healthy fit appearance',
  muscle_gain: 'muscular athletic body, well-defined arms, broad shoulders, visible chest muscles, strong legs, V-taper silhouette',
  six_pack: 'extremely lean with clearly visible six-pack abdominal muscles, vascular forearms, shredded muscle definition throughout',
  bodybuilder: 'competition-ready bodybuilder physique, massive muscle volume, extreme definition, visible vascularity, stage-ready condition',
  fit_active: 'fit healthy body, lean with moderate muscle tone, energetic appearance, athletic posture, healthy weight range',
  bulk: 'maximum muscle mass, very large arms and shoulders, thick chest, wide back, powerful legs, significant size increase'
};

const BODY_TYPE_DESCRIPTIONS = {
  slim: 'currently slim build with low muscle mass and minimal definition',
  average: 'average body build with moderate body fat and some muscle',
  overweight: 'overweight with visible excess fat around abdomen, chest, and face',
  obese: 'significantly overweight body requiring major transformation',
  athletic: 'already athletic base, optimizing and adding definition'
};

export function buildTransformationPrompt(goals: UserGoalData) {
  const weightChange = `transformed from ${goals.currentWeight}kg to ${goals.goalWeight}kg`;
  const lostKg = goals.currentWeight - goals.goalWeight;
  const gainedMuscle = goals.bodyGoal === 'muscle_gain' || goals.bodyGoal === 'bulk';

  const mainPrompt = `Generate a professional fitness transformation photograph of the person in the provided image.

The person should have the EXACT SAME FACE, facial features, skin tone, and hairstyle as the original photo. This is a visualization of the same individual after a successful fitness journey.

Transformation Details:
- The person has ${weightChange} over ${goals.timeline}.
- New physique: ${GOAL_DESCRIPTIONS[goals.bodyGoal]}.
${lostKg > 0 ? `- Visible fat loss of ${lostKg}kg, resulting in a leaner face and defined midsection.` : ''}
${gainedMuscle ? `- Significant athletic muscle growth in the shoulders, arms, and chest.` : ''}
${goals.specificNotes ? `- Note: ${goals.specificNotes}` : ''}

Style:
- High-quality, photorealistic fitness photography.
- Natural gym or studio lighting.
- Sharp focus, 8K resolution, realistic skin textures.
- The person should look confident and healthy.
- Maintain the same overall composition and camera angle as the original photo.`;

  const negativePrompt = `different person, face change, different facial features, altered face, morphed face, different skin tone, CGI, cartoon, anime, illustration, drawing, painting, 3D render, fake, watermark, text, logo, signature, extra limbs, deformed hands, bad anatomy, multiple people, low quality, pixelated.`;

  return { mainPrompt, negativePrompt };
}
