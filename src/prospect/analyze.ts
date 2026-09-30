import type { Lead, Operacao } from "./types.js";
import { analyzeRaioX, type RaioX } from "./raiox.js";
import { analyzeQualification, type QualReport } from "./qualification.js";
import { pickArguments, recommendOffer, scoreLead, whyUs, type LeadScore, type OfferPlan, type PickedArgument, type WhyUs } from "./offer.js";
import { buildMiniAudit, type MiniAudit } from "./audit.js";
import { buildApproach, type Approach, type ApproachRefusal } from "./approach.js";
import { buildPitch, type Pitch } from "./pitch.js";

export type Analysis = {
  raiox: RaioX; qual: QualReport; why: WhyUs; offer: OfferPlan; score: LeadScore;
  audit: MiniAudit; approach: Approach | ApproachRefusal; args: PickedArgument[]; pitch: Pitch;
};

/** Tudo o que o app mostra sobre um lead, derivado só dos dados registrados. */
export function analyzeLead(lead: Lead, op: Operacao): Analysis {
  const raiox = analyzeRaioX(lead);
  const qual = analyzeQualification(lead);
  const offer = recommendOffer(lead, raiox, qual, op);
  const why = whyUs(lead, raiox, qual, op);
  const score = scoreLead(lead, raiox, qual, op);
  const audit = buildMiniAudit(lead, raiox, qual, op);
  const approach = buildApproach(lead, raiox, qual, op);
  const args = pickArguments(raiox, lead, qual, 4);
  const pitch = buildPitch(lead, raiox, qual, op, why, offer);
  return { raiox, qual, why, offer, score, audit, approach, args, pitch };
}
