function log(msg) {
  const logDiv = document.getElementById("log");
  logDiv.textContent += `\n${msg}`;
  console.log(msg);
}

function setStatus(msg) {
  document.getElementById("log").textContent = msg;
  console.log(msg);
}

async function startAgent() {
  const nvidiaKey = document.getElementById("nvidiaKey").value.trim();
  const userPrompt = document.getElementById("userPrompt").value.trim();
  const btn = document.getElementById("generateBtn");

  if (!nvidiaKey || !userPrompt) {
    alert("Please provide your NVIDIA API key and a prompt concept.");
    return;
  }

  btn.disabled = true;
  document.getElementById("imageOutput").innerHTML = "";

  try {
    // ----------------------------------------------------
    // STEP 1: Enhance Prompt with NVIDIA (Llama 3.1)
    // ----------------------------------------------------
    setStatus("🤖 Agent is refining prompt using NVIDIA Llama 3.1...");

    const gptResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${nvidiaKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-40b-instruct",
        messages: [
          { 
            role: "system", 
            content: "You are an expert AI prompt engineer. Turn simple ideas into highly detailed, visual, cinematic image prompts. Return ONLY the enhanced prompt text." 
          },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 250
      })
    });

    if (!gptResponse.ok) throw new Error(`NVIDIA Text API Error: ${gptResponse.statusText}`);
    const gptData = await gptResponse.json();
    const enhancedPrompt = gptData.choices[0].message.content.trim();

    log(`✨ Enhanced Prompt:\n"${enhancedPrompt}"`);

    // ----------------------------------------------------
    // STEP 2: Generate Image with NVIDIA (FLUX.1 Schnell)
    // ----------------------------------------------------
    log("\n🎨 Generating Image via NVIDIA FLUX.1...");

    const imageResponse = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux1-schnell", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${nvidiaKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        mode: "base"
      })
    });

    if (!imageResponse.ok) throw new Error(`NVIDIA Image API Error: ${imageResponse.statusText}`);
    const imageData = await imageResponse.json();

    // Extract image data (NVIDIA returns base64 string or artifact output)
    let imageSrc = "";
    if (imageData.b64_json) {
      imageSrc = `data:image/jpeg;base64,${imageData.b64_json}`;
    } else if (imageData.artifacts && imageData.artifacts[0].base64) {
      imageSrc = `data:image/jpeg;base64,${imageData.artifacts[0].base64}`;
    } else if (imageData.images && imageData.images[0].url) {
      imageSrc = imageData.images[0].url;
    }

    log(`🖼️ Image Successfully Generated!`);
    document.getElementById("imageOutput").innerHTML = `
      <h3>Generated NVIDIA Image</h3>
      <img src="${imageSrc}" alt="NVIDIA Generated Image" />
    `;

  } catch (err) {
    log(`\n❌ Error: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}
