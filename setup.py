#!/usr/bin/env python3
"""
DataGenesis AI - Setup Script
Automated setup for the DataGenesis AI synthetic data generation platform.
"""

import os
import sys
import subprocess
import json
import platform
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
    UNDERLINE = '\033[4m'

def print_banner():
    banner = f"""
{Colors.HEADER}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                    DataGenesis AI Setup                      ║
║                                                              ║
║         Intelligent Synthetic Data Generation Platform       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
{Colors.ENDC}
"""
    print(banner)

def run_command(command, description, check=True):
    """Run a command with colored output."""
    print(f"{Colors.OKCYAN}► {description}...{Colors.ENDC}")
    try:
        result = subprocess.run(command, shell=True, check=check, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"{Colors.OKGREEN}✓ {description} completed successfully{Colors.ENDC}")
            return True
        else:
            print(f"{Colors.FAIL}✗ {description} failed{Colors.ENDC}")
            if result.stderr:
                print(f"{Colors.FAIL}Error: {result.stderr}{Colors.ENDC}")
            return False
    except subprocess.CalledProcessError as e:
        print(f"{Colors.FAIL}✗ {description} failed: {e}{Colors.ENDC}")
        return False
    except Exception as e:
        print(f"{Colors.FAIL}✗ Unexpected error in {description}: {e}{Colors.ENDC}")
        return False

def check_prerequisites():
    """Check if required tools are installed."""
    print(f"{Colors.BOLD}Checking prerequisites...{Colors.ENDC}")
    
    requirements = {
        'node': 'Node.js 18+',
        'npm': 'npm package manager',
        'python3': 'Python 3.8+',
        'pip': 'pip package manager'
    }
    
    missing = []
    for cmd, desc in requirements.items():
        if subprocess.run(f"which {cmd}", shell=True, capture_output=True).returncode != 0:
            missing.append(desc)
    
    if missing:
        print(f"{Colors.FAIL}✗ Missing prerequisites:{Colors.ENDC}")
        for item in missing:
            print(f"  - {item}")
        print(f"{Colors.WARNING}Please install missing prerequisites and run setup again.{Colors.ENDC}")
        return False
    
    print(f"{Colors.OKGREEN}✓ All prerequisites satisfied{Colors.ENDC}")
    return True

def setup_environment():
    """Set up environment files."""
    print(f"{Colors.BOLD}Setting up environment...{Colors.ENDC}")
    
    # Check if .env already exists
    if os.path.exists('.env'):
        print(f"{Colors.WARNING}⚠ .env file already exists. Skipping environment setup.{Colors.ENDC}")
        return True
    
    # Copy .env.example to .env
    if os.path.exists('.env.example'):
        run_command('cp .env.example .env', 'Creating environment file from template')
        print(f"{Colors.WARNING}📝 Please edit .env file with your actual API keys:{Colors.ENDC}")
        print("  - VITE_SUPABASE_URL")
        print("  - VITE_SUPABASE_ANON_KEY")  
        print("  - VITE_GEMINI_API_KEY")
        return True
    else:
        print(f"{Colors.FAIL}✗ .env.example not found{Colors.ENDC}")
        return False

def install_frontend_deps():
    """Install frontend dependencies."""
    print(f"{Colors.BOLD}Installing frontend dependencies...{Colors.ENDC}")
    return run_command('npm install', 'Installing Node.js packages')

def setup_backend():
    """Set up backend if it exists."""
    print(f"{Colors.BOLD}Setting up backend...{Colors.ENDC}")
    
    if os.path.exists('backend'):
        os.chdir('backend')
        
        # Create virtual environment
        if not os.path.exists('venv'):
            run_command('python3 -m venv venv', 'Creating Python virtual environment')
        
        # Install requirements
        if os.path.exists('requirements.txt'):
            if platform.system() == 'Windows':
                run_command('venv\\Scripts\\activate && pip install -r requirements.txt', 'Installing Python packages')
            else:
                run_command('source venv/bin/activate && pip install -r requirements.txt', 'Installing Python packages')
        
        # Copy environment file
        if os.path.exists('.env.example') and not os.path.exists('.env'):
            run_command('cp .env.example .env', 'Creating backend environment file')
        
        os.chdir('..')
        return True
    else:
        print(f"{Colors.OKCYAN}⚠ Backend directory not found. Skipping backend setup.{Colors.ENDC}")
        return True

def verify_installation():
    """Verify the installation."""
    print(f"{Colors.BOLD}Verifying installation...{Colors.ENDC}")
    
    # Check package.json
    if os.path.exists('package.json'):
        with open('package.json', 'r') as f:
            package_data = json.load(f)
            print(f"{Colors.OKGREEN}✓ Project: {package_data.get('name', 'Unknown')}{Colors.ENDC}")
    
    # Check node_modules
    if os.path.exists('node_modules'):
        print(f"{Colors.OKGREEN}✓ Frontend dependencies installed{Colors.ENDC}")
    else:
        print(f"{Colors.FAIL}✗ Frontend dependencies missing{Colors.ENDC}")
        return False
    
    # Check environment
    if os.path.exists('.env'):
        print(f"{Colors.OKGREEN}✓ Environment file exists{Colors.ENDC}")
    else:
        print(f"{Colors.WARNING}⚠ Environment file missing{Colors.ENDC}")
    
    return True

def print_next_steps():
    """Print next steps for the user."""
    print(f"""
{Colors.HEADER}
╔══════════════════════════════════════════════════════════════╗
║                        Setup Complete!                       ║
╚══════════════════════════════════════════════════════════════╝
{Colors.ENDC}

{Colors.BOLD}Next steps:{Colors.ENDC}

{Colors.OKGREEN}1. Configure your environment variables:{Colors.ENDC}
   Edit .env file with your API keys:
   - Get Supabase credentials from: https://supabase.com
   - Get Gemini API key from: https://makersuite.google.com/app/apikey

{Colors.OKGREEN}2. Start the development server:{Colors.ENDC}
   {Colors.OKCYAN}python run.py{Colors.ENDC}

{Colors.OKGREEN}3. Access the application:{Colors.ENDC}
   Frontend: http://localhost:5173
   Backend API: http://localhost:8000/api (if backend is running)

{Colors.WARNING}Important:{Colors.ENDC}
- Configure Supabase with the provided SQL migration in /supabase/migrations/
- Enable Google OAuth in Supabase Auth settings for Google sign-in
- Set up your Gemini API key for AI functionality

{Colors.BOLD}Need help?{Colors.ENDC}
- Check README.md for detailed documentation
- Ensure all environment variables are properly configured
- Verify Supabase project is set up with required tables

{Colors.OKGREEN}Happy generating! 🚀{Colors.ENDC}
""")

def main():
    """Main setup function."""
    print_banner()
    
    try:
        # Check prerequisites
        if not check_prerequisites():
            sys.exit(1)
        
        # Set up environment
        if not setup_environment():
            print(f"{Colors.FAIL}✗ Environment setup failed{Colors.ENDC}")
            sys.exit(1)
        
        # Install frontend dependencies
        if not install_frontend_deps():
            print(f"{Colors.FAIL}✗ Frontend setup failed{Colors.ENDC}")
            sys.exit(1)
        
        # Set up backend
        if not setup_backend():
            print(f"{Colors.FAIL}✗ Backend setup failed{Colors.ENDC}")
            sys.exit(1)
        
        # Verify installation
        if not verify_installation():
            print(f"{Colors.WARNING}⚠ Installation verification had issues{Colors.ENDC}")
        
        # Print next steps
        print_next_steps()
        
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Setup interrupted by user{Colors.ENDC}")
        sys.exit(1)
    except Exception as e:
        print(f"{Colors.FAIL}✗ Setup failed with error: {e}{Colors.ENDC}")
        sys.exit(1)

if __name__ == "__main__":
    main()