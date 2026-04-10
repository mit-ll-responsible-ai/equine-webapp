import threading
from typing import Dict, Callable, Any
from pathlib import Path


class ModelManager:
    """
    Thread-safe singleton model manager for lazy loading and caching models.
    Works with custom model loading functions.
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        """Ensure singleton pattern"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(ModelManager, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize the model cache"""
        if self._initialized:
            return
            
        self._models: Dict[str, Any] = {}
        self._model_locks: Dict[str, threading.Lock] = {}
        self._initialized = True
        print("ModelManager initialized")
    
    def get_model(
        self, 
        model_path: str, 
        load_function: Callable[[str], Any],
        force_reload: bool = False
    ) -> Any:
        """
        Get a model by path. Loads if not already cached.
        
        Args:
            model_path: Path to the model file
            load_function: Function to load the model (takes model_path as argument)
            force_reload: If True, reload the model even if cached
            
        Returns:
            The loaded model
        """
        # Ensure we have a lock for this model path
        if model_path not in self._model_locks:
            with self._lock:
                if model_path not in self._model_locks:
                    self._model_locks[model_path] = threading.Lock()
        
        # Check if model is already loaded (unless force_reload)
        if not force_reload and model_path in self._models:
            return self._models[model_path]
        
        # Load the model (thread-safe per model path)
        with self._model_locks[model_path]:
            # Double-check after acquiring lock
            if not force_reload and model_path in self._models:
                return self._models[model_path]
            
            print(f"Loading model from: {model_path}")
            
            # Verify path exists
            if not Path(model_path).exists():
                raise FileNotFoundError(f"Model file not found: {model_path}")
            
            # Load the model using the provided function
            model = load_function(model_path)
            
            # Cache the model
            self._models[model_path] = model
            print(f"Model loaded successfully: {model_path}")
            
            return model
    
    def unload_model(self, model_path: str) -> bool:
        """
        Unload a model from cache to free memory.
        
        Args:
            model_path: Path to the model to unload
            
        Returns:
            True if model was unloaded, False if not found
        """
        if model_path not in self._models:
            return False
        
        with self._model_locks.get(model_path, self._lock):
            if model_path in self._models:
                del self._models[model_path]
                print(f"Model unloaded: {model_path}")
                return True
        return False
    
    def clear_all(self):
        """Unload all models from cache"""
        with self._lock:
            model_paths = list(self._models.keys())
            for path in model_paths:
                self.unload_model(path)
            print("All models cleared from cache")
    
    def list_loaded_models(self) -> list:
        """Return list of currently loaded model paths"""
        return list(self._models.keys())
    
    def get_cache_info(self) -> dict:
        """Get information about cached models"""
        return {
            'num_models_loaded': len(self._models),
            'model_paths': self.list_loaded_models()
        }


# Global singleton instance
model_manager = ModelManager()