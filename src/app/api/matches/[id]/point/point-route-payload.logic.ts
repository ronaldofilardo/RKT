import type { PointFlowInput } from '@/schemas/contracts';

export function buildAnnotationsPayload(
  data: PointFlowInput,
  doublesMeta?: {
    hitterId?: string;
    receiverId?: string;
    courtSide?: 'deuce' | 'ad';
  },
) {
  const hasFirstFaultDetail = Boolean(
    data.firstFaultDetail &&
      (data.firstFaultDetail.errorType ||
        data.firstFaultDetail.serveEffect ||
        data.firstFaultDetail.direction ||
        Object.keys(data.firstFaultDetail).length > 0)
  ) || Boolean(
    data.annotations?.firstFaultDetail &&
      (data.annotations.firstFaultDetail.errorType ||
        data.annotations.firstFaultDetail.serveEffect ||
        data.annotations.firstFaultDetail.direction ||
        Object.keys(data.annotations.firstFaultDetail).length > 0)
  );

  const isExplicitSecondServe =
    data.type === 'DOUBLE_FAULT' ||
    hasFirstFaultDetail ||
    data.isSecondServe === true ||
    data.annotations?.isSecondServe === true ||
    data.isFirstServe === false ||
    data.annotations?.isFirstServe === false;

  const isSecondServe = isExplicitSecondServe;
  const isFirstServe = !isSecondServe;

  const firstFaultDetail =
    data.firstFaultDetail ??
    data.annotations?.firstFaultDetail ??
    undefined;

  const rallyDetails =
    data.rallyDetails ??
    data.annotations?.rallyDetails ??
    undefined;

  const rallyLength =
    data.rallyLength ??
    data.annotations?.rallyLength ??
    undefined;

  const note =
    data.annotations?.note ??
    rallyDetails?.note ??
    undefined;

  const zone = data.annotations?.zone;
  const stroke = data.annotations?.stroke;

  const hitterId = doublesMeta?.hitterId ?? data.hitterId ?? data.annotations?.hitterId;
  const receiverId = doublesMeta?.receiverId ?? data.receiverId ?? data.annotations?.receiverId;
  const courtSide = doublesMeta?.courtSide ?? data.courtSide ?? data.annotations?.courtSide;

  return {
    ...(data.annotations ?? {}),
    isFirstServe,
    isSecondServe,
    ...(firstFaultDetail !== undefined ? { firstFaultDetail } : {}),
    ...(rallyDetails !== undefined ? { rallyDetails } : {}),
    ...(rallyLength !== undefined ? { rallyLength } : {}),
    ...(note !== undefined ? { note } : {}),
    ...(zone !== undefined ? { zone } : {}),
    ...(stroke !== undefined ? { stroke } : {}),
    ...(hitterId !== undefined ? { hitterId } : {}),
    ...(receiverId !== undefined ? { receiverId } : {}),
    ...(courtSide !== undefined ? { courtSide } : {}),
  };
}
