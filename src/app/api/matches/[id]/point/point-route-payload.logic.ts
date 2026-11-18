import type { PointFlowInput } from '@/schemas/contracts';

function isFaultPopulated(detail?: Record<string, unknown> | null): boolean {
  if (!detail) return false;
  if (detail.errorType || detail.serveEffect || detail.direction) return true;
  return Object.keys(detail).length > 0;
}

function resolveServeFlags(data: PointFlowInput, hasFault: boolean) {
  const isSecond =
    data.type === 'DOUBLE_FAULT' ||
    hasFault ||
    data.isSecondServe === true ||
    data.annotations?.isSecondServe === true ||
    data.isFirstServe === false ||
    data.annotations?.isFirstServe === false;
  return { isSecondServe: isSecond, isFirstServe: !isSecond };
}

function resolveDoublesMeta(
  data: PointFlowInput,
  doublesMeta?: { hitterId?: string; receiverId?: string; courtSide?: 'deuce' | 'ad' },
) {
  return {
    hitterId: doublesMeta?.hitterId ?? data.hitterId ?? data.annotations?.hitterId,
    receiverId: doublesMeta?.receiverId ?? data.receiverId ?? data.annotations?.receiverId,
    courtSide: doublesMeta?.courtSide ?? data.courtSide ?? data.annotations?.courtSide,
  };
}

function assignDefined(target: Record<string, any>, key: string, value: unknown) {
  if (value !== undefined) {
    target[key] = value;
  }
}

export function buildAnnotationsPayload(
  data: PointFlowInput,
  doublesMeta?: {
    hitterId?: string;
    receiverId?: string;
    courtSide?: 'deuce' | 'ad';
  },
) {
  const hasFirstFaultDetail =
    isFaultPopulated(data.firstFaultDetail as Record<string, unknown>) ||
    isFaultPopulated(data.annotations?.firstFaultDetail as Record<string, unknown>);

  const { isFirstServe, isSecondServe } = resolveServeFlags(data, hasFirstFaultDetail);
  const firstFaultDetail = data.firstFaultDetail ?? data.annotations?.firstFaultDetail;
  const rallyDetails = data.rallyDetails ?? data.annotations?.rallyDetails;
  const rallyLength = data.rallyLength ?? data.annotations?.rallyLength;
  const note = data.annotations?.note ?? rallyDetails?.note;
  const { hitterId, receiverId, courtSide } = resolveDoublesMeta(data, doublesMeta);

  const result: Record<string, any> = {
    ...(data.annotations ?? {}),
    isFirstServe,
    isSecondServe,
  };

  assignDefined(result, 'firstFaultDetail', firstFaultDetail);
  assignDefined(result, 'rallyDetails', rallyDetails);
  assignDefined(result, 'rallyLength', rallyLength);
  assignDefined(result, 'note', note);
  assignDefined(result, 'zone', data.annotations?.zone);
  assignDefined(result, 'stroke', data.annotations?.stroke);
  assignDefined(result, 'hitterId', hitterId);
  assignDefined(result, 'receiverId', receiverId);
  assignDefined(result, 'courtSide', courtSide);

  return result;
}
