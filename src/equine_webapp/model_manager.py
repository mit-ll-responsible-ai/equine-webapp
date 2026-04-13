# Copyright (c) 2026 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT

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

        file_dir = Path(__file__).parent.resolve()
        self._allowed_base_dir = (file_dir / "webapp-output" / "models").resolve()
        print("ModelManager initialized")

    def _validate_model_path(self, model_path: str) -> Path:
        """
        Validate and resolve model path to prevent path traversal attacks.
        Only allows paths within the current working directory.
        
        Args:
            model_path: Path to validate
            
        Returns:
            Resolved Path object
            
        Raises:
            ValueError: If path is outside allowed directory
            FileNotFoundError: If path doesn't exist
        """
        # Resolve to absolute path
        resolved_path = Path(model_path).resolve()
        
        # Check if path exists
        if not resolved_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        # Verify path is within allowed base directory
        try:
            resolved_path.relative_to(self._allowed_base_dir)
        except ValueError:
            raise ValueError(
                f"Model path must be within allowed directory. "
                f"Path: {resolved_path}, Allowed: {self._allowed_base_dir}"
            )
        
        return resolved_path
    
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
        # Validate and resolve path
        resolved_path = self._validate_model_path(model_path)
        path_str = str(resolved_path)
        
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