use anyhow::Context;
use llama_cpp_2::{
    llama_backend::LlamaBackend,
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
