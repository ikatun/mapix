export async function extractDataFromResponse(requestPromise, postProcess) {
  const { data } = await requestPromise;

  return postProcess ? postProcess(data) : data;
}
