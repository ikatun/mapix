export async function extractDataFromResponse(requestPromise) {
  const { data } = await requestPromise;

  return data;
}
