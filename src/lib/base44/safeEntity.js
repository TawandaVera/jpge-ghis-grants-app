export async function listEntity(entity, options = {}) {
  const { order = "-created_date", limit = 50, filters = {} } = options;

  if (!entity?.list) {
    throw new Error("Base44 entity list() is unavailable or the entity name is incorrect.");
  }

  return entity.list({
    order,
    limit,
    ...filters,
  });
}

export async function filterEntity(entity, filters = {}, options = {}) {
  const { order, limit } = options;

  if (!entity?.filter) {
    throw new Error("Base44 entity filter() is unavailable or the entity name is incorrect.");
  }

  const result = await entity.filter(filters);
  const safeResult = Array.isArray(result) ? result : [];

  if (order) {
    const desc = order.startsWith("-");
    const field = desc ? order.slice(1) : order;
    safeResult.sort((a, b) => {
      const av = a?.[field] ?? "";
      const bv = b?.[field] ?? "";
      return desc
        ? String(bv).localeCompare(String(av))
        : String(av).localeCompare(String(bv));
    });
  }

  return typeof limit === "number" ? safeResult.slice(0, limit) : safeResult;
}

export async function createEntity(entity, payload) {
  if (!entity?.create) {
    throw new Error("Base44 entity create() is unavailable or the entity name is incorrect.");
  }

  return entity.create(payload);
}

export async function updateEntity(entity, id, payload) {
  if (!entity?.update) {
    throw new Error("Base44 entity update() is unavailable or the entity name is incorrect.");
  }

  if (!id) {
    throw new Error("Missing entity id for update.");
  }

  return entity.update(id, payload);
}

export function toSafeArray(value) {
  return Array.isArray(value) ? value : [];
}

export async function safeLoad(loader, fallback = []) {
  try {
    return await loader();
  } catch (error) {
    console.error("[Base44 safeLoad]", error);
    return fallback;
  }
}
