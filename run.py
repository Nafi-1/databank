#!/usr/bin/env python3
"""
DataGenesis AI - Run Script
Start the DataGenesis AI development environment.
"""

import os
import sys
import subprocess
import json
import time
import threading
import signal
from pathlib import Path

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_banner():
    banner = f"""
{Colors.HEADER}
╔══════════════════════════════════════════════════════════════╗
║                   DataGenesis AI Starting                    ║
║             Intelligent Synthetic Data Platform              ║
╚══════════════════════════════════════════════════════════════╝
{Colors.ENDC}
"""
    print(banner)

def check_env_file():
    """Check if environment file exists and has required variables."""
    if not os.path.exists('.env'):
        print(f"{Colors.FAIL}✗ .env file not found{Colors.ENDC}")
        print(f"{Colors.WARNING}Please run 'python setup.py' first to set up the environment{Colors.ENDC}")
        return False
    
    required_vars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_GEMINI_API_KEY']
    missing_vars = []
    
    with open('.env', 'r') as f:
        env_content = f.read()
        for var in required_vars:
            if f"{var}=" not in env_content or f"{var}=your_" in env_content:
                missing_vars.append(var)
    
    if missing_vars:
        print(f"{Colors.WARNING}⚠ Missing or unconfigured environment variables:{Colors.ENDC}")
        for var in missing_vars:
            print(f"  - {var}")
        print(f"{Colors.WARNING}Please configure these in your .env file{Colors.ENDC}")
        return False
    
    return True

def check_dependencies():
    """Check if dependencies are installed."""
    if not os.path.exists('node_modules'):
        print(f"{Colors.FAIL}✗ Node.js dependencies not found{Colors.ENDC}")
        print(f"{Colors.WARNING}Please run 'python setup.py' first to install dependencies{Colors.ENDC}")
        return False
    
    return True

def start_frontend():
    """Start the frontend development server."""
    print(f"{Colors.OKCYAN}► Starting frontend development server...{Colors.ENDC}")
    try:
        process = subprocess.Popen(['npm', 'run', 'dev'], 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.STDOUT,
                                 universal_newlines=True,
                                 bufsize=1)
        
        # Monitor output for ready signal
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(f"{Colors.OKBLUE}[Frontend]{Colors.ENDC} {output.strip()}")
                if "Local:" in output and "localhost" in output:
                    print(f"{Colors.OKGREEN}✓ Frontend server is ready!{Colors.ENDC}")
                    break
        
        return process
    except Exception as e:
        print(f"{Colors.FAIL}✗ Failed to start frontend: {e}{Colors.ENDC}")
        return None

def start_backend():
    """Start the backend server if it exists."""
    if not os.path.exists('backend'):
        print(f"{Colors.OKCYAN}⚠ Backend directory not found. Running frontend only.{Colors.ENDC}")
        return None
    
    print(f"{Colors.OKCYAN}► Starting backend server...{Colors.ENDC}")
    try:
        os.chdir('backend')
        
        # Check if virtual environment exists
        if os.path.exists('venv'):
            if os.name == 'nt':  # Windows
                python_cmd = 'venv\\Scripts\\python'
            else:  # Unix/Linux/Mac
                python_cmd = 'venv/bin/python'
        else:
            python_cmd = 'python3'
        
        process = subprocess.Popen([python_cmd, '-m', 'uvicorn', 'app.main:app', '--reload', '--host', '0.0.0.0', '--port', '8000'],
                                 stdout=subprocess.PIPE,
                                 stderr=subprocess.STDOUT,
                                 universal_newlines=True,
                                 bufsize=1)
        
        os.chdir('..')
        
        # Monitor output for ready signal
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(f"{Colors.OKBLUE}[Backend]{Colors.ENDC} {output.strip()}")
                if "Uvicorn running on" in output:
                    print(f"{Colors.OKGREEN}✓ Backend server is ready!{Colors.ENDC}")
                    break
        
        return process
    except Exception as e:
        print(f"{Colors.FAIL}✗ Failed to start backend: {e}{Colors.ENDC}")
        os.chdir('..')
        return None

def print_ready_message():
    """Print the ready message with URLs."""
    print(f"""
{Colors.HEADER}
╔══════════════════════════════════════════════════════════════╗
║                   🚀 DataGenesis AI Ready!                   ║
╚══════════════════════════════════════════════════════════════╝
{Colors.ENDC}

{Colors.BOLD}Application URLs:{Colors.ENDC}
{Colors.OKGREEN}Frontend:{Colors.ENDC}  http://localhost:5173
{Colors.OKGREEN}Backend API:{Colors.ENDC} http://localhost:8000/api (if running)
{Colors.OKGREEN}API Docs:{Colors.ENDC}   http://localhost:8000/api/docs (if running)

{Colors.BOLD}Quick Start:{Colors.ENDC}
1. Open http://localhost:5173 in your browser
2. Try "Enter as Guest" for quick demo access
3. Or sign up/sign in for full features

{Colors.WARNING}Note:{Colors.ENDC} 
- Ensure your Supabase project is configured
- Gemini API key should be set for AI features
- Use Ctrl+C to stop all services

{Colors.OKGREEN}Happy generating! ✨{Colors.ENDC}
""")

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully."""
    print(f"\n{Colors.WARNING}Shutting down DataGenesis AI...{Colors.ENDC}")
    sys.exit(0)

def main():
    """Main run function."""
    # Set up signal handler
    signal.signal(signal.SIGINT, signal_handler)
    
    print_banner()
    
    # Check prerequisites
    if not check_env_file():
        sys.exit(1)
    
    if not check_dependencies():
        sys.exit(1)
    
    print(f"{Colors.OKGREEN}✓ Environment check passed{Colors.ENDC}")
    
    processes = []
    
    try:
        # Start backend if available
        backend_process = start_backend()
        if backend_process:
            processes.append(backend_process)
            time.sleep(2)  # Give backend time to start
        
        # Start frontend
        frontend_process = start_frontend()
        if frontend_process:
            processes.append(frontend_process)
            time.sleep(2)  # Give frontend time to start
        else:
            print(f"{Colors.FAIL}✗ Failed to start frontend{Colors.ENDC}")
            sys.exit(1)
        
        # Print ready message
        print_ready_message()
        
        # Keep the script running and monitor processes
        while True:
            time.sleep(1)
            for process in processes:
                if process.poll() is not None:
                    print(f"{Colors.FAIL}✗ A service stopped unexpectedly{Colors.ENDC}")
                    sys.exit(1)
    
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Received shutdown signal{Colors.ENDC}")
    except Exception as e:
        print(f"{Colors.FAIL}✗ Unexpected error: {e}{Colors.ENDC}")
    finally:
        # Clean up processes
        for process in processes:
            try:
                process.terminate()
                process.wait(timeout=5)
            except:
                try:
                    process.kill()
                except:
                    pass
        
        print(f"{Colors.OKGREEN}✓ DataGenesis AI stopped cleanly{Colors.ENDC}")

if __name__ == "__main__":
    main()