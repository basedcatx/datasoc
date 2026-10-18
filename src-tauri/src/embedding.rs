use anyhow::{Context, Ok};
use llama_cpp::sys::{
    context::LlamaContext,
    llama_backend::LlamaBackend,
    llama_batch::LlamaBatch,
    model::{params::LlamaModelParams, LlamaModel},
};

use std::path::Path;
use std::sync::Mutex;

pub struct EmbeddingEngine {
    pub backend: LlamaBackend,
    pub model: Mutex<LlamaModel>,
}

impl EmbeddingEngine {
    pub fn new<P: AsRef<Path>>(model_path: P) -> anyhow::Result<Self> {
        let backend = LlamaBackend::init()?;
        let model_params = std::pin::pin!(LlamaModelParams::default());
        let model = LlamaModel::load_from_file(&backend, model_path, &model_params)
            .map_err(|_| anyhow::anyhow!("Failed to load GGUF from file"))?;
        Ok(Self {
            backend,
            model: Mutex::new(model),
        })
    }
}

pub fn batch_decode(
    ctx: &mut LlamaContext,
    batch: &mut LlamaBatch,
    s_batch: i32,
    output: &mut Vec<Vec<f32>>,
) -> anyhow::Result<bool> {
    ctx.clear_kv_cache();

    ctx.decode(batch)
        .with_context(|| "llama_decode failed".to_owned())?;

    for i in 0..s_batch {
        let embedding = ctx
            .embeddings_seq_ith(i)
            .with_context(|| "Failed to get embedding".to_owned())?;
        let output_embedding = normalize(embedding);
        output.push(output_embedding);
    }

    batch.clear();

    Ok(true)
}

pub fn normalize(inputs: &[f32]) -> Vec<f32> {
    //l2 normalization
    let mag = inputs
        .iter()
        .fold(0.0, |acc, &val| val.mul_add(val, acc))
        .sqrt();

    if mag == 0.0 {
        return inputs.to_vec();
    }

    return inputs.iter().map(|&i| i / mag).collect();
}

pub fn init(model_path: std::path::PathBuf) -> anyhow::Result<EmbeddingEngine> {
    println!("Booting LlamaBackend & loading model from {:?}", model_path);

    let engine = EmbeddingEngine::new(model_path)
        .with_context(|| "Failed to initialize embedding model on boot {e.to_strin()}")?;

    Ok(engine)
}
